import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HOT_LEAD_MIN_VISITS = 2

// GET: Get hot leads (visitors who visited multiple times)
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
    const days = parseInt(searchParams.get('days') || '30', 10)
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Get visitors with multiple visits
    const { data: visitors, error } = await supabase
      .from('landing_page_visitors')
      .select('visitor_id, fingerprint, visit_count, first_visit, last_visit, referrer, city, country, device_type, has_signed_up')
      .eq('partner_id', partner.id)
      .gte('last_visit', sinceDate)
      .gte('visit_count', HOT_LEAD_MIN_VISITS)
      .order('visit_count', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch hot leads' }, { status: 500 })
    }

    // Categorize leads by heat level
    const leads = (visitors || []).map(v => {
      let heat: 'warm' | 'hot' | 'fire'
      if (v.visit_count >= 5) {
        heat = 'fire'
      } else if (v.visit_count >= 3) {
        heat = 'hot'
      } else {
        heat = 'warm'
      }

      return {
        ...v,
        heat,
        days_since_last_visit: Math.floor(
          (Date.now() - new Date(v.last_visit).getTime()) / (24 * 60 * 60 * 1000)
        ),
      }
    })

    // Summary stats
    const totalHotLeads = leads.length
    const fireLeads = leads.filter(l => l.heat === 'fire').length
    const convertedLeads = leads.filter(l => l.has_signed_up).length

    return NextResponse.json({
      leads,
      summary: {
        total: totalHotLeads,
        fire: fireLeads,
        hot: leads.filter(l => l.heat === 'hot').length,
        warm: leads.filter(l => l.heat === 'warm').length,
        converted: convertedLeads,
        conversion_rate: totalHotLeads > 0 ? ((convertedLeads / totalHotLeads) * 100).toFixed(1) : '0',
      },
    })
  } catch (error) {
    console.error('Hot leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Track visitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partner_id, fingerprint, referrer, page_url, user_agent } = body

    if (!partner_id || !fingerprint) {
      return NextResponse.json({ error: 'partner_id and fingerprint are required' }, { status: 400 })
    }

    // Verify partner exists
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('id', partner_id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Parse device type from user agent
    let deviceType = 'desktop'
    if (user_agent) {
      const ua = user_agent.toLowerCase()
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'mobile'
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet'
      }
    }

    // Check if visitor already exists
    const { data: existingVisitor } = await supabase
      .from('landing_page_visitors')
      .select('id, visit_count')
      .eq('partner_id', partner_id)
      .eq('fingerprint', fingerprint)
      .single()

    if (existingVisitor) {
      // Update existing visitor
      await supabase
        .from('landing_page_visitors')
        .update({
          visit_count: existingVisitor.visit_count + 1,
          last_visit: new Date().toISOString(),
        })
        .eq('id', existingVisitor.id)

      // Log individual visit
      await supabase.from('landing_page_visit_log').insert({
        visitor_id: existingVisitor.id,
        partner_id,
        page_url: page_url || null,
        referrer: referrer || null,
        visited_at: new Date().toISOString(),
      })

      return NextResponse.json({
        tracked: true,
        visit_count: existingVisitor.visit_count + 1,
        is_hot_lead: existingVisitor.visit_count + 1 >= HOT_LEAD_MIN_VISITS,
      })
    } else {
      // Create new visitor record
      const { data: newVisitor } = await supabase
        .from('landing_page_visitors')
        .insert({
          partner_id,
          fingerprint,
          visitor_id: crypto.randomUUID(),
          visit_count: 1,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          referrer: referrer || null,
          device_type: deviceType,
          has_signed_up: false,
        })
        .select()
        .single()

      if (newVisitor) {
        await supabase.from('landing_page_visit_log').insert({
          visitor_id: newVisitor.id,
          partner_id,
          page_url: page_url || null,
          referrer: referrer || null,
          visited_at: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        tracked: true,
        visit_count: 1,
        is_hot_lead: false,
      })
    }
  } catch (error) {
    console.error('Visitor tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
