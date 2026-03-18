import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-cron-master')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // TODO: implement system health check (DB, MetaApi, Anthropic connectivity)
    return NextResponse.json({ success: true, job: 'health-check', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'health-check failed' }, { status: 500 })
  }
}
