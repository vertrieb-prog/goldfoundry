import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TaskDefinition {
  id: string
  title: string
  description: string
  fp_reward: number
  category: string
}

const DAILY_TASK_POOL: TaskDefinition[] = [
  { id: 'share_performance', title: 'Share a trader performance card', description: 'Generate and share a performance screenshot on any platform', fp_reward: 20, category: 'sharing' },
  { id: 'invite_contact', title: 'Send an invite to a contact', description: 'Send a personalized invite link to someone new', fp_reward: 30, category: 'growth' },
  { id: 'post_content', title: 'Post on social media', description: 'Create and post content about GoldFoundry on any platform', fp_reward: 25, category: 'content' },
  { id: 'update_landing', title: 'Update your landing page', description: 'Improve your partner landing page with fresh content', fp_reward: 15, category: 'profile' },
  { id: 'coach_session', title: 'Ask the AI coach a question', description: 'Have a coaching conversation to improve your strategy', fp_reward: 10, category: 'learning' },
  { id: 'review_leads', title: 'Review your hot leads', description: 'Check and follow up with your most engaged leads', fp_reward: 20, category: 'leads' },
  { id: 'reply_referral', title: 'Message a referral', description: 'Send a check-in message to one of your active referrals', fp_reward: 15, category: 'retention' },
  { id: 'watch_training', title: 'Complete a training module', description: 'Watch a partner training video or read a guide', fp_reward: 20, category: 'learning' },
  { id: 'set_goal', title: 'Set a weekly goal', description: 'Define your growth target for this week', fp_reward: 10, category: 'planning' },
  { id: 'engage_community', title: 'Engage in the community', description: 'Post or comment in the partner community channel', fp_reward: 15, category: 'community' },
]

function getDailyTasks(partnerId: string, date: string): TaskDefinition[] {
  // Deterministic daily selection based on partner ID and date
  const seed = `${partnerId}-${date}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  const shuffled = [...DAILY_TASK_POOL].sort((a, b) => {
    const hashA = ((hash << 5) - hash) + a.id.charCodeAt(0)
    const hashB = ((hash << 5) - hash) + b.id.charCodeAt(0)
    return hashA - hashB
  })

  return shuffled.slice(0, 5)
}

// GET: Get daily tasks
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: partner } = await supabase
      .from('partners')
      .select('id, task_streak, last_task_date')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]
    const dailyTasks = getDailyTasks(partner.id, today)

    // Fetch completed tasks for today
    const { data: completedTasks } = await supabase
      .from('partner_task_completions')
      .select('task_id')
      .eq('partner_id', partner.id)
      .eq('completed_date', today)

    const completedTaskIds = new Set(completedTasks?.map(t => t.task_id) || [])

    const tasksWithStatus = dailyTasks.map(task => ({
      ...task,
      completed: completedTaskIds.has(task.id),
    }))

    const completedCount = tasksWithStatus.filter(t => t.completed).length

    // Check streak
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const isStreakActive = partner.last_task_date === today || partner.last_task_date === yesterday

    return NextResponse.json({
      date: today,
      tasks: tasksWithStatus,
      progress: {
        completed: completedCount,
        total: 5,
        all_done: completedCount === 5,
      },
      streak: {
        current: isStreakActive ? (partner.task_streak || 0) : 0,
        active: isStreakActive,
      },
    })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Complete a task
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: partner } = await supabase
      .from('partners')
      .select('id, founder_points, task_streak, last_task_date')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const body = await request.json()
    const { task_id, proof_url } = body

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const dailyTasks = getDailyTasks(partner.id, today)
    const task = dailyTasks.find(t => t.id === task_id)

    if (!task) {
      return NextResponse.json({ error: 'This task is not available today' }, { status: 400 })
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from('partner_task_completions')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('task_id', task_id)
      .eq('completed_date', today)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Task already completed today' }, { status: 400 })
    }

    // Record completion
    await supabase.from('partner_task_completions').insert({
      partner_id: partner.id,
      task_id,
      completed_date: today,
      proof_url: proof_url || null,
      fp_earned: task.fp_reward,
      created_at: new Date().toISOString(),
    })

    // Update streak
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const newStreak = (partner.last_task_date === yesterday || partner.last_task_date === today)
      ? (partner.task_streak || 0) + (partner.last_task_date === today ? 0 : 1)
      : 1

    // Award FP and update streak
    let bonusFp = 0
    if (newStreak > 0 && newStreak % 7 === 0) {
      bonusFp = 100 // Weekly streak bonus
    }

    await supabase
      .from('partners')
      .update({
        founder_points: partner.founder_points + task.fp_reward + bonusFp,
        task_streak: newStreak,
        last_task_date: today,
      })
      .eq('id', partner.id)

    // Check if all 5 tasks done today for daily completion bonus
    const { data: todayCompletions } = await supabase
      .from('partner_task_completions')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('completed_date', today)

    let dailyBonus = 0
    if (todayCompletions && todayCompletions.length === 5) {
      dailyBonus = 50
      await supabase
        .from('partners')
        .update({ founder_points: partner.founder_points + task.fp_reward + bonusFp + dailyBonus })
        .eq('id', partner.id)
    }

    return NextResponse.json({
      completed: true,
      task_id,
      fp_earned: task.fp_reward,
      streak_bonus: bonusFp,
      daily_completion_bonus: dailyBonus,
      total_earned: task.fp_reward + bonusFp + dailyBonus,
      streak: newStreak,
    })
  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
