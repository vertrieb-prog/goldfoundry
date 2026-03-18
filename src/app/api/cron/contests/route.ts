import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('x-cron-master')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // TODO: implement update contest standings and determine winners
    return NextResponse.json({ success: true, job: 'contests', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'contests failed' }, { status: 500 })
  }
}
