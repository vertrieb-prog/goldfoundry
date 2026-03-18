import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-cron-master')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // TODO: implement generate monthly performance reports
    return NextResponse.json({ success: true, job: 'performance-reports', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'performance-reports failed' }, { status: 500 })
  }
}
