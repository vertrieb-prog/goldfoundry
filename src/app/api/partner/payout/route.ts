import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIN_PAYOUT_FP = 5000
const FP_TO_EUR_RATE = 0.01 // 1 FP = €0.01

// POST: Request FP payout
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
      .select('id, founder_points, kyc_status, payout_method, payout_details')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    // KYC check
    if (partner.kyc_status !== 'verified') {
      return NextResponse.json(
        { error: 'KYC verification required before requesting payouts. Please complete identity verification first.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount_fp } = body

    if (!amount_fp || typeof amount_fp !== 'number' || amount_fp < MIN_PAYOUT_FP) {
      return NextResponse.json(
        { error: `Minimum payout is ${MIN_PAYOUT_FP} FP` },
        { status: 400 }
      )
    }

    if (amount_fp > partner.founder_points) {
      return NextResponse.json(
        { error: `Insufficient FP balance. You have ${partner.founder_points} FP.` },
        { status: 400 }
      )
    }

    // Check for pending payouts
    const { data: pendingPayout } = await supabase
      .from('partner_payouts')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('status', 'pending')
      .single()

    if (pendingPayout) {
      return NextResponse.json(
        { error: 'You already have a pending payout request. Please wait for it to be processed.' },
        { status: 400 }
      )
    }

    const amount_eur = amount_fp * FP_TO_EUR_RATE

    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from('partner_payouts')
      .insert({
        partner_id: partner.id,
        amount_fp,
        amount_eur_cents: Math.round(amount_eur * 100),
        payout_method: partner.payout_method,
        payout_details: partner.payout_details,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (payoutError) {
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }

    // Deduct FP from partner balance
    await supabase
      .from('partners')
      .update({ founder_points: partner.founder_points - amount_fp })
      .eq('id', partner.id)

    return NextResponse.json({
      payout,
      message: `Payout request for ${amount_fp} FP (~${amount_eur.toFixed(2)}EUR) submitted. Processing takes 3-5 business days.`,
    })
  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Payout history
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
      .select('id, founder_points')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const { data: payouts, error } = await supabase
      .from('partner_payouts')
      .select('id, amount_fp, amount_eur_cents, payout_method, status, requested_at, processed_at, notes')
      .eq('partner_id', partner.id)
      .order('requested_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    const totalPaidOut = payouts
      ?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount_fp, 0) || 0

    return NextResponse.json({
      payouts,
      balance_fp: partner.founder_points,
      total_paid_out_fp: totalPaidOut,
      min_payout_fp: MIN_PAYOUT_FP,
    })
  } catch (error) {
    console.error('Payout history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
