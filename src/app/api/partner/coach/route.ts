import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const COACH_SYSTEM_PROMPT = `You are an AI partner coach for GoldFoundry, a copy-trading platform. You help partners grow their referral business, improve engagement, and maximize their Founder Points earnings.

Your expertise includes:
- Social media marketing strategies for financial products
- Building trust and credibility as a trading partner
- Converting leads into active traders
- Retention strategies to keep referred users engaged
- Best practices for sharing trading performance
- Community building on WhatsApp, Telegram, and Instagram

Always be encouraging, actionable, and specific. Provide concrete next steps. Keep responses concise and practical. Never provide specific financial advice or make return promises.`

// POST: Send message to AI partner coach
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
      .select('id, tier, founder_points, invites_used, invite_quota')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const body = await request.json()
    const { message, conversation_id } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch recent conversation history if conversation_id provided
    let conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (conversation_id) {
      const { data: history } = await supabase
        .from('partner_coach_messages')
        .select('role, content')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (history) {
        conversationMessages = history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      }
    }

    // Fetch partner stats for context
    const { data: referralCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('partner_id', partner.id)

    const partnerContext = `Partner stats: Tier=${partner.tier}, FP=${partner.founder_points}, Invites used=${partner.invites_used}/${partner.invite_quota}, Total referrals=${referralCount?.length || 0}`

    conversationMessages.push({ role: 'user', content: message })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `${COACH_SYSTEM_PROMPT}\n\nCurrent ${partnerContext}`,
      messages: conversationMessages,
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // Generate or reuse conversation_id
    const convId = conversation_id || crypto.randomUUID()

    // Save both messages
    await supabase.from('partner_coach_messages').insert([
      {
        conversation_id: convId,
        partner_id: partner.id,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      },
      {
        conversation_id: convId,
        partner_id: partner.id,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString(),
      },
    ])

    return NextResponse.json({
      conversation_id: convId,
      response: assistantMessage,
    })
  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
