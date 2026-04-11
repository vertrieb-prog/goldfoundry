import { NextRequest, NextResponse } from 'next/server'

const SENTINEL_BACKEND = 'http://87.106.83.244:3001'

async function proxyToSentinel(req: NextRequest, path: string) {
  const url = `${SENTINEL_BACKEND}/sentinel/${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const forwardedFor = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
  headers['X-Forwarded-For'] = forwardedFor

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      init.body = await req.text()
    } catch {
      // no body
    }
  }

  try {
    const response = await fetch(url, init)
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (err) {
    console.error('Sentinel proxy error:', err)
    return NextResponse.json(
      { error: 'Sentinel backend unavailable' },
      { status: 502 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyToSentinel(req, path.join('/'))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyToSentinel(req, path.join('/'))
}
