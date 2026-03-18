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

type Platform = 'instagram' | 'whatsapp' | 'telegram' | 'twitter'

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  instagram: 'Create an engaging Instagram post caption. Use line breaks for readability, include relevant emojis, add 5-8 hashtags at the end. Keep it under 2200 characters. Focus on visual storytelling.',
  whatsapp: 'Create a WhatsApp broadcast message. Keep it personal and conversational. Use emojis sparingly. Include a clear CTA. Keep it under 500 characters for easy reading on mobile.',
  telegram: 'Create a Telegram channel post. Can be slightly longer. Use markdown formatting (bold, italic). Include a clear CTA link placeholder. Professional but approachable tone.',
  twitter: 'Create a tweet or thread. Keep individual tweets under 280 characters. If a thread, mark each tweet with numbering. Be punchy and engaging. Include 2-3 hashtags max.',
}

// POST: Generate social media content
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
      .select('id, tier')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const body = await request.json()
    const { platform, topic, tone, language, trader_id, save_as_template } = body

    if (!platform || !PLATFORM_GUIDELINES[platform as Platform]) {
      return NextResponse.json(
        { error: 'Invalid platform. Choose: instagram, whatsapp, telegram, twitter' },
        { status: 400 }
      )
    }

    // Optionally fetch trader data for context
    let traderContext = ''
    if (trader_id) {
      const { data: trader } = await supabase
        .from('traders')
        .select('display_name, strategy_name')
        .eq('id', trader_id)
        .single()

      if (trader) {
        const { data: perf } = await supabase
          .from('trader_performance')
          .select('profit_pct, win_rate')
          .eq('trader_id', trader_id)
          .order('date', { ascending: false })
          .limit(30)

        const totalProfit = perf?.reduce((s, p) => s + (p.profit_pct || 0), 0) || 0
        const avgWin = perf?.length ? perf.reduce((s, p) => s + (p.win_rate || 0), 0) / perf.length : 0

        traderContext = `\nTrader to feature: ${trader.display_name} (Strategy: ${trader.strategy_name}). 30-day performance: ${totalProfit.toFixed(1)}% profit, ${avgWin.toFixed(0)}% win rate.`
      }
    }

    const prompt = `Generate social media content for a copy-trading platform partner.

Platform: ${platform}
${PLATFORM_GUIDELINES[platform as Platform]}

${topic ? `Topic/angle: ${topic}` : 'Topic: General promotion of copy-trading benefits'}
${tone ? `Tone: ${tone}` : 'Tone: Professional but approachable'}
${language ? `Language: ${language}` : 'Language: English'}
${traderContext}

Important: Never promise specific returns. Use phrases like "past performance" when referencing numbers. Include a placeholder [YOUR_LINK] where the partner invite link should go.

Generate 3 variations.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const generatedContent = response.content[0].type === 'text' ? response.content[0].text : ''

    // Log content generation
    const { data: contentRecord } = await supabase
      .from('partner_content')
      .insert({
        partner_id: partner.id,
        platform,
        topic: topic || 'general',
        generated_text: generatedContent,
        is_template: save_as_template || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return NextResponse.json({
      content_id: contentRecord?.id,
      platform,
      generated: generatedContent,
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Saved templates
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    let query = supabase
      .from('partner_content')
      .select('id, platform, topic, generated_text, is_template, created_at')
      .eq('partner_id', partner.id)
      .eq('is_template', true)
      .order('created_at', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: templates, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Template fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
