import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-cron-master')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // TODO: implement process FORGE Points vesting (3-month schedule)
    return NextResponse.json({ success: true, job: 'vesting', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'vesting failed' }, { status: 500 })
  }
}
