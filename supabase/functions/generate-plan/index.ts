// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Parse body safely
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty
    }
    const { force } = body;

    // 1. Get User
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')
    
    const userId = user.id

    // 2. Define "Today"
    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    // 3. Handle FORCE Regeneration (Clean up pending assignments)
    if (force) {
      // Delete only 'assigned' (not completed) missions created today or later
      await supabaseClient
        .from('user_mission_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'assigned')
        .gte('assigned_at', todayStart.toISOString())
    }

    // 4. Check if plan exists (after cleanup)
    const { data: existingAssignments } = await supabaseClient
      .from('user_mission_assignments')
      .select('id')
      .eq('user_id', userId)
      .gte('assigned_at', todayStart.toISOString())

    // If we have assignments and NOT forcing (or force didn't clear everything because some were completed),
    // we stop here. But if force was true, we likely want to fill the gaps if we deleted pending ones.
    // For simplicity: If assignments exist > 0 and we are not strictly trying to fill gaps, we return.
    // However, if we just deleted pending ones, existingAssignments might be only the completed ones.
    // We want to generate new ones to reach the target quota.
    
    // Let's get Profile to know quotas
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('track_id, time_daily, level_initial')
      .eq('user_id', userId)
      .single()

    // Determine quotas
    // 60+ min = 1 Daily + 1-2 Sides. Let's aim for 2 total active tasks minimum.
    const targetCount = profile?.time_daily && profile.time_daily >= 60 ? 3 : 2; 
    const currentCount = existingAssignments?.length || 0;

    if (currentCount >= targetCount && !force) {
       return new Response(JSON.stringify({ message: 'Plan already exists', assignments: existingAssignments }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // If we are here, we need to generate more missions
    const missionsNeeded = Math.max(1, targetCount - currentCount);
    const missionsToAssign = []

    // 5. Select Missions
    // A. Daily Quest (Try to have 1 if none exists)
    // Check if we already have a daily assigned today
    // We need to fetch types of existing assignments to be smart, but for MVP random is okay,
    // let's just ensure we pick valid ones.

    // Fetch IDs of missions already assigned/completed ever? Or just today? 
    // Usually we don't repeat missions ever for Main/Side, but Daily repeats.
    // For MVP: Don't repeat any mission currently assigned today.
    
    const assignedTodayIds = existingAssignments?.map(a => a.mission_id) || []; // This is actually assignments, we need to join missions... 
    // Easier: fetch assignment with mission_id
    const { data: todayAssigns } = await supabaseClient
      .from('user_mission_assignments')
      .select('mission_id')
      .eq('user_id', userId)
      .gte('assigned_at', todayStart.toISOString())
    
    const todayMissionIds = todayAssigns?.map(a => a.mission_id) || [];

    // Also avoid recently completed Side/Main missions (last 30 days?)
    // For MVP: Just avoid what is currently assigned today.

    // B. FETCH CANDIDATE MISSIONS
    // Filter: (Track IS NULL OR Track = UserTrack) AND IsActive = True
    
    let missionQuery = supabaseClient
      .from('missions')
      .select('id, type')
      .eq('is_active', true)
    
    if (profile.track_id) {
       missionQuery = missionQuery.or(`track_id.is.null,track_id.eq.${profile.track_id}`)
    } else {
       missionQuery = missionQuery.is('track_id', null)
    }

    const { data: candidates } = await missionQuery;
    
    if (!candidates || candidates.length === 0) {
       return new Response(JSON.stringify({ success: false, message: 'No active missions found for your track.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Filter out missions already assigned today
    const available = candidates.filter(m => !todayMissionIds.includes(m.id));

    // Separate by type
    const dailies = available.filter(m => m.type === 'daily');
    const others = available.filter(m => m.type !== 'daily'); // Main & Side

    // Logic: 
    // 1. Ensure 1 Daily is present (if we don't have one today).
    // Note: checking todayMissionIds type would be expensive without joining. 
    // Let's just blindly add 1 daily if we have quota, and fill rest with others.

    let slots = missionsNeeded;

    // Pick 1 Daily
    if (slots > 0 && dailies.length > 0) {
       const randomDaily = dailies[Math.floor(Math.random() * dailies.length)];
       missionsToAssign.push(randomDaily.id);
       slots--;
    }

    // Pick Rest from Others
    if (slots > 0 && others.length > 0) {
       // Shuffle
       const shuffled = others.sort(() => 0.5 - Math.random());
       const picked = shuffled.slice(0, slots);
       picked.forEach(m => missionsToAssign.push(m.id));
    }

    // 6. Insert Assignments
    if (missionsToAssign.length > 0) {
      const newAssignments = missionsToAssign.map(missionId => ({
        user_id: userId,
        mission_id: missionId,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabaseClient
        .from('user_mission_assignments')
        .insert(newAssignments)
      
      if (insertError) throw insertError
    }

    return new Response(JSON.stringify({ success: true, count: missionsToAssign.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[generate-plan] error", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})