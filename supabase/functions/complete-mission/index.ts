// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Level thresholds from plan.md
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
    
    // Bonus: Reflection (+10%)
    if (reflection && reflection.length >= 10) {
      xpGained += Math.floor(assignment.mission.xp_reward * 0.1)
    }
    
    // Bonus: Evidence (+15%)
    if (evidence_url && evidence_url.length > 0) {
      xpGained += Math.floor(assignment.mission.xp_reward * 0.15)
    }

    // 3. Update DB (Sequential operations for safety, could be RPC for strict atomicity)
    
    // A. Insert Completion
    const { error: completionError } = await supabaseClient
      .from('completions')
      .insert({
        user_id: user.id,
        mission_id: assignment.mission_id,
        evidence_url: evidence_url,
        reflection: reflection
      })
    if (completionError) throw completionError

    // B. Update Assignment Status
    const { error: updateAssignError } = await supabaseClient
      .from('user_mission_assignments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignment_id)
    if (updateAssignError) throw updateAssignError

    // C. Insert XP Event
    const { error: xpError } = await supabaseClient
      .from('xp_events')
      .insert({
        user_id: user.id,
        source_type: 'completion',
        source_id: assignment.mission_id, // Linking to mission logically
        xp: xpGained,
        skill_id: assignment.mission.skill_id
      })
    if (xpError) throw xpError

    // D. Update User Stats (XP, Level, Streak)
    // Get current stats first
    const { data: stats } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentXp = stats?.xp_total || 0
    const newXpTotal = currentXp + xpGained
    const newLevel = calculateLevel(newXpTotal)
    
    // Streak Logic
    let newStreak = stats?.streak_current || 0
    let lastDaily = stats?.last_daily_completed_at ? new Date(stats.last_daily_completed_at) : null
    const today = new Date()
    today.setHours(0,0,0,0) // Normalize to midnight

    // Only update streak if it's a DAILY mission
    if (assignment.mission.type === 'daily') {
      if (!lastDaily) {
        // First ever daily
        newStreak = 1
      } else {
        // Check difference in days
        // We need to be careful with timezones, simpler approach:
        // formatting to YYYY-MM-DD string might be safer for day comparison
        const lastDateStr = lastDaily.toISOString().split('T')[0]
        const todayStr = today.toISOString().split('T')[0]
        
        if (lastDateStr === todayStr) {
          // Already did a daily today, streak doesn't increase, but doesn't break
          // newStreak remains same
        } else {
          // Check if yesterday
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          if (lastDateStr === yesterdayStr) {
             newStreak += 1
          } else {
             // Streak broken
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
       updates.last_daily_completed_at = new Date().toISOString() // Save full timestamp, DB casts to date if column is DATE
    }

    const { error: statsError } = await supabaseClient
      .from('user_stats')
      .update(updates)
      .eq('user_id', user.id)
    
    if (statsError) throw statsError

    return new Response(JSON.stringify({ 
      success: true, 
      xp_gained: xpGained,
      new_level: newLevel,
      level_up: newLevel > (stats?.level || 1)
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