import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Generate performance screenshot card
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const body = await request.json()
    const { trader_id, period, template } = body

    if (!trader_id) {
      return NextResponse.json({ error: 'trader_id is required' }, { status: 400 })
    }

    // Fetch trader performance data
    const { data: trader, error: traderError } = await supabase
      .from('traders')
      .select('id, display_name, avatar_url, strategy_name')
      .eq('id', trader_id)
      .single()

    if (traderError || !trader) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 })
    }

    // Fetch performance metrics for the period
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30
    const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: performance } = await supabase
      .from('trader_performance')
      .select('date, profit_pct, drawdown_pct, trades_count, win_rate')
      .eq('trader_id', trader_id)
      .gte('date', sinceDate)
      .order('date', { ascending: true })

    const totalProfit = performance?.reduce((sum, p) => sum + (p.profit_pct || 0), 0) || 0
    const avgWinRate = performance?.length
      ? performance.reduce((sum, p) => sum + (p.win_rate || 0), 0) / performance.length
      : 0
    const maxDrawdown = performance?.reduce((max, p) => Math.min(max, p.drawdown_pct || 0), 0) || 0
    const totalTrades = performance?.reduce((sum, p) => sum + (p.trades_count || 0), 0) || 0

    // Create screenshot record with card data
    const cardData = {
      trader_name: trader.display_name,
      strategy: trader.strategy_name,
      avatar_url: trader.avatar_url,
      period: `${periodDays}d`,
      profit_pct: totalProfit.toFixed(2),
      win_rate: avgWinRate.toFixed(1),
      max_drawdown: maxDrawdown.toFixed(2),
      total_trades: totalTrades,
      template: template || 'dark',
      generated_at: new Date().toISOString(),
    }

    const { data: screenshot, error: screenshotError } = await supabase
      .from('partner_screenshots')
      .insert({
        partner_id: partner.id,
        trader_id,
        card_data: cardData,
        status: 'generating',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (screenshotError) {
      return NextResponse.json({ error: 'Failed to create screenshot record' }, { status: 500 })
    }

    // Generate the image via rendering service (server-side HTML-to-image)
    const renderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/render-card`
    const renderResponse = await fetch(renderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_data: cardData, screenshot_id: screenshot.id }),
    })

    let imageUrl = null
    if (renderResponse.ok) {
      const renderResult = await renderResponse.json()
      imageUrl = renderResult.image_url

      await supabase
        .from('partner_screenshots')
        .update({ status: 'completed', image_url: imageUrl })
        .eq('id', screenshot.id)
    } else {
      await supabase
        .from('partner_screenshots')
        .update({ status: 'failed' })
        .eq('id', screenshot.id)
    }

    return NextResponse.json({
      screenshot_id: screenshot.id,
      card_data: cardData,
      image_url: imageUrl,
      status: imageUrl ? 'completed' : 'generating',
    })
  } catch (error) {
    console.error('Screenshot generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
