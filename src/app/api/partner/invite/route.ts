import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Generate invite link/code for partner
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

    // Verify user is a partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, invite_quota, invites_used')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    if (partner.invites_used >= partner.invite_quota) {
      return NextResponse.json({ error: 'Invite quota exhausted. Purchase a builder pack for more invites.' }, { status: 403 })
    }

    const code = randomBytes(6).toString('hex').toUpperCase()

    const { data: invite, error: insertError } = await supabase
      .from('partner_invites')
      .insert({
        partner_id: partner.id,
        code,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Increment invites_used
    await supabase
      .from('partners')
      .update({ invites_used: partner.invites_used + 1 })
      .eq('id', partner.id)

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?code=${code}`

    return NextResponse.json({ invite, link: inviteLink })
  } catch (error) {
    console.error('Invite creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: List pending invites
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
    const status = searchParams.get('status') || 'pending'

    const { data: invites, error } = await supabase
      .from('partner_invites')
      .select('id, code, status, created_at, expires_at, redeemed_by, redeemed_at')
      .eq('partner_id', partner.id)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Invite list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
