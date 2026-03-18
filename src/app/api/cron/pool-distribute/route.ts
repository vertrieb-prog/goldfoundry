import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-cron-master')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // TODO: implement distribute performance pool to qualified partners
    return NextResponse.json({ success: true, job: 'pool-distribute', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'pool-distribute failed' }, { status: 500 })
  }
}
