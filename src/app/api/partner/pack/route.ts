import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PACK_TIERS: Record<string, { count: number; price: number }> = {
  'pack-5':  { count: 5,  price: 9900 },   // €99
  'pack-10': { count: 10, price: 17900 },   // €179
  'pack-25': { count: 25, price: 39900 },   // €399
  'pack-50': { count: 50, price: 69900 },   // €699
}

// POST: Purchase builder pack
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
      .select('id, invite_quota')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const body = await request.json()
    const { pack_id, payment_method_id } = body

    const pack = PACK_TIERS[pack_id]
    if (!pack) {
      return NextResponse.json(
        { error: 'Invalid pack. Choose: pack-5, pack-10, pack-25, pack-50' },
        { status: 400 }
      )
    }

    // Record the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('partner_pack_purchases')
      .insert({
        partner_id: partner.id,
        pack_id,
        invite_count: pack.count,
        price_cents: pack.price,
        payment_method_id,
        status: 'completed',
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (purchaseError) {
      return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 })
    }

    // Increase invite quota
    const { error: updateError } = await supabase
      .from('partners')
      .update({ invite_quota: partner.invite_quota + pack.count })
      .eq('id', partner.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update quota' }, { status: 500 })
    }

    return NextResponse.json({
      purchase,
      new_quota: partner.invite_quota + pack.count,
      message: `Successfully added ${pack.count} invites to your account.`,
    })
  } catch (error) {
    console.error('Pack purchase error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: List owned packs
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
      .select('id, invite_quota, invites_used')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 403 })
    }

    const { data: purchases, error } = await supabase
      .from('partner_pack_purchases')
      .select('id, pack_id, invite_count, price_cents, status, purchased_at')
      .eq('partner_id', partner.id)
      .order('purchased_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch packs' }, { status: 500 })
    }

    return NextResponse.json({
      purchases,
      quota: {
        total: partner.invite_quota,
        used: partner.invites_used,
        remaining: partner.invite_quota - partner.invites_used,
      },
      available_packs: PACK_TIERS,
    })
  } catch (error) {
    console.error('Pack list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
