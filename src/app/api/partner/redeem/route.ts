import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Redeem invite code
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

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Look up the invite
    const { data: invite, error: inviteError } = await supabase
      .from('partner_invites')
      .select('id, partner_id, status, expires_at')
      .eq('code', code.toUpperCase().trim())
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invite code has already been used' }, { status: 400 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 })
    }

    // Check user hasn't already been referred
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .single()

    if (existingReferral) {
      return NextResponse.json({ error: 'You have already been referred by another partner' }, { status: 400 })
    }

    // Create referral relationship
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        partner_id: invite.partner_id,
        referred_user_id: user.id,
        invite_id: invite.id,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (referralError) {
      return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
    }

    // Mark invite as redeemed
    await supabase
      .from('partner_invites')
      .update({
        status: 'redeemed',
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    // Award founder points to the partner
    await supabase.rpc('award_founder_points', {
      p_partner_id: invite.partner_id,
      p_amount: 100,
      p_reason: 'invite_redeemed',
      p_reference_id: referral.id,
    })

    return NextResponse.json({
      message: 'Invite code redeemed successfully',
      referral,
    })
  } catch (error) {
    console.error('Redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
