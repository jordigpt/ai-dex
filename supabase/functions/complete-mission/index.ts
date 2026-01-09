// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LEVEL_THRESHOLDS = [
  0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 
  6500, 7700, 9000, 10400, 11900, 13500, 15200, 17000, 18900, 20900
];

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { assignment_id, evidence_url, reflection } = await req.json()

    if (!assignment_id) throw new Error('Assignment ID is required')

    // 1. Get Assignment & Mission Details
    const { data: assignment, error: assignError } = await supabaseClient
      .from('user_mission_assignments')
      .select(`
        id, 
        status, 
        mission_id,
        mission:missions (
          id, 
          xp_reward, 
          type, 
          skill_id
        )
      `)
      .eq('id', assignment_id)
      .eq('user_id', user.id)
      .single()

    if (assignError || !assignment) throw new Error('Assignment not found')
    if (assignment.status === 'completed') throw new Error('Mission already completed')

    // 2. Calculate XP
    let xpGained = assignment.mission.xp_reward
    if (reflection && reflection.length >= 10) xpGained += Math.floor(assignment.mission.xp_reward * 0.1)
    if (evidence_url && evidence_url.length > 0) xpGained += Math.floor(assignment.mission.xp_reward * 0.15)

    // 3. Update DB Operations
    const { error: completionError } = await supabaseClient
      .from('completions')
      .insert({
        user_id: user.id,
        mission_id: assignment.mission_id,
        evidence_url: evidence_url,
        reflection: reflection
      })
    if (completionError) throw completionError

    const { error: updateAssignError } = await supabaseClient
      .from('user_mission_assignments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignment_id)
    if (updateAssignError) throw updateAssignError

    const { error: xpError } = await supabaseClient
      .from('xp_events')
      .insert({
        user_id: user.id,
        source_type: 'completion',
        source_id: assignment.mission_id,
        xp: xpGained,
        skill_id: assignment.mission.skill_id
      })
    if (xpError) throw xpError

    // 4. Update Stats & Check Unlocks
    const { data: stats } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentXp = stats?.xp_total || 0
    const newXpTotal = currentXp + xpGained
    const newLevel = calculateLevel(newXpTotal)
    
    let newStreak = stats?.streak_current || 0
    let lastDaily = stats?.last_daily_completed_at ? new Date(stats.last_daily_completed_at) : null
    const today = new Date()
    today.setHours(0,0,0,0)

    if (assignment.mission.type === 'daily') {
      if (!lastDaily) {
        newStreak = 1
      } else {
        const lastDateStr = lastDaily.toISOString().split('T')[0]
        const todayStr = today.toISOString().split('T')[0]
        
        if (lastDateStr !== todayStr) {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          if (lastDateStr === yesterdayStr) {
             newStreak += 1
          } else {
             newStreak = 1
          }
        }
      }
    }

    const updates = {
       xp_total: newXpTotal,
       level: newLevel,
       streak_current: newStreak,
       streak_best: Math.max(newStreak, stats?.streak_best || 0),
       last_active_at: new Date().toISOString()
    }

    if (assignment.mission.type === 'daily') {
       updates.last_daily_completed_at = new Date().toISOString()
    }

    await supabaseClient
      .from('user_stats')
      .update(updates)
      .eq('user_id', user.id)

    // 5. Check DEX Unlocks
    // Fetch all active cards
    const { data: allCards } = await supabaseClient
      .from('dex_cards')
      .select('*')
      .eq('is_active', true)
    
    // Fetch already unlocked
    const { data: unlocked } = await supabaseClient
      .from('user_dex_unlocks')
      .select('dex_card_id')
      .eq('user_id', user.id)
    
    const unlockedIds = new Set(unlocked?.map(u => u.dex_card_id) || [])
    const newUnlocks = []

    if (allCards) {
      for (const card of allCards) {
        if (unlockedIds.has(card.id)) continue;
        
        let shouldUnlock = false;
        const rule = card.unlock_rule;

        if (rule && rule.type === 'level') {
          if (newLevel >= rule.value) shouldUnlock = true;
        } else if (rule && rule.type === 'streak') {
          if (newStreak >= rule.value) shouldUnlock = true;
        }
        // Add more rules here (e.g., mission count) if needed

        if (shouldUnlock) {
          newUnlocks.push({
            user_id: user.id,
            dex_card_id: card.id
          })
        }
      }
    }

    if (newUnlocks.length > 0) {
      await supabaseClient.from('user_dex_unlocks').insert(newUnlocks)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      xp_gained: xpGained,
      new_level: newLevel,
      level_up: newLevel > (stats?.level || 1),
      new_unlocks: newUnlocks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[complete-mission] error", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})