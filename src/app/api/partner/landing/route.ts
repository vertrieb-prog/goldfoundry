import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch partner landing page data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const partnerId = searchParams.get('partner_id')

    if (!slug && !partnerId) {
      return NextResponse.json({ error: 'slug or partner_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('partner_landing_pages')
      .select(`
        id,
        partner_id,
        slug,
        headline,
        bio,
        photo_url,
        video_url,
        selected_traders,
        theme,
        cta_text,
        social_links,
        is_published,
        created_at,
        updated_at
      `)

    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.eq('partner_id', partnerId)
    }

    const { data: landing, error } = await query.single()

    if (error || !landing) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
    }

    // If fetching by slug (public view), track the visit
    if (slug) {
      await supabase.from('landing_page_visits').insert({
        landing_page_id: landing.id,
        partner_id: landing.partner_id,
        visited_at: new Date().toISOString(),
        referrer: request.headers.get('referer') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
    }

    return NextResponse.json({ landing })
  } catch (error) {
    console.error('Landing page fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Update landing page
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
    const { headline, bio, photo_url, video_url, selected_traders, slug, theme, cta_text, social_links, is_published } = body

    // Validate slug uniqueness if provided
    if (slug) {
      const { data: existingSlug } = await supabase
        .from('partner_landing_pages')
        .select('id')
        .eq('slug', slug)
        .neq('partner_id', partner.id)
        .single()

      if (existingSlug) {
        return NextResponse.json({ error: 'This URL slug is already taken' }, { status: 400 })
      }
    }

    // Upsert landing page
    const { data: landing, error: upsertError } = await supabase
      .from('partner_landing_pages')
      .upsert(
        {
          partner_id: partner.id,
          headline: headline || null,
          bio: bio || null,
          photo_url: photo_url || null,
          video_url: video_url || null,
          selected_traders: selected_traders || [],
          slug: slug || null,
          theme: theme || 'default',
          cta_text: cta_text || 'Join Now',
          social_links: social_links || {},
          is_published: is_published ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'partner_id' }
      )
      .select()
      .single()

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update landing page' }, { status: 500 })
    }

    return NextResponse.json({ landing })
  } catch (error) {
    console.error('Landing page update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
