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

    // 1. Get User
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')
    
    const userId = user.id

    // 2. Check if plan already exists for today
    // We check assignments created today
    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)
    
    const { data: existingAssignments } = await supabaseClient
      .from('user_mission_assignments')
      .select('id')
      .eq('user_id', userId)
      .gte('assigned_at', todayStart.toISOString())

    if (existingAssignments && existingAssignments.length > 0) {
      return new Response(JSON.stringify({ message: 'Plan already exists', assignments: existingAssignments }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Get Profile to know preferences (time, track)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('track_id, time_daily, level_initial')
      .eq('user_id', userId)
      .single()

    // 4. Select Missions
    // Logic: 
    // - Always 1 Daily Quest (random from type='daily')
    // - 1-2 Side/Main quests based on time_daily
    
    const missionsToAssign = []

    // A. Get a random Daily
    const { data: dailies } = await supabaseClient
      .from('missions')
      .select('id')
      .eq('type', 'daily')
      .eq('is_active', true)
    
    if (dailies && dailies.length > 0) {
      const randomDaily = dailies[Math.floor(Math.random() * dailies.length)]
      missionsToAssign.push(randomDaily.id)
    }

    // B. Get a Sidequest (Universal or Track specific)
    // For MVP, we prioritize Setup missions if not completed, but simple logic for now:
    // Fetch non-completed side missions
    
    // Get IDs of completed missions to exclude
    const { data: completed } = await supabaseClient
      .from('completions')
      .select('mission_id')
      .eq('user_id', userId)
    
    const completedIds = completed?.map(c => c.mission_id) || []

    let query = supabaseClient
      .from('missions')
      .select('id')
      .eq('type', 'side')
      .eq('is_active', true)
    
    if (completedIds.length > 0) {
      query = query.not('id', 'in', `(${completedIds.join(',')})`)
    }

    // Filter by track (universal missions have null track_id, or match user track)
    // query = query.or(`track_id.is.null,track_id.eq.${profile.track_id}`) 
    // Note: complex OR filters can be tricky in JS client, let's keep it simple: fetch all valid and filter in memory for MVP randomness
    
    const { data: sides } = await query
    
    if (sides && sides.length > 0) {
      // Pick 1 or 2 based on time
      const count = profile?.time_daily && profile.time_daily >= 60 ? 2 : 1
      
      // Shuffle array
      const shuffled = sides.sort(() => 0.5 - Math.random())
      const selectedSides = shuffled.slice(0, count)
      
      selectedSides.forEach(m => missionsToAssign.push(m.id))
    }

    // 5. Insert Assignments
    if (missionsToAssign.length > 0) {
      const assignments = missionsToAssign.map(missionId => ({
        user_id: userId,
        mission_id: missionId,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabaseClient
        .from('user_mission_assignments')
        .insert(assignments)
      
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