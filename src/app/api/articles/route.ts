import { NextRequest, NextResponse } from 'next/server';

// Route handlers take priority over the /api/* rewrite in next.config.ts.
// We proxy both GET (public list) and POST (create — admin) here so all
// methods for this path are handled and the rewrite does not interfere.

export const dynamic = 'force-dynamic';

const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
const CORS = { 'Access-Control-Allow-Origin': '*' };

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();
  const url = `${API_URL}/articles${qs ? `?${qs}` : ''}`;

  try {
    const upstream = await fetch(url, { cache: 'no-store' });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: CORS });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch articles' }, { status: 502, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const upstream = await fetch(`${API_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      body,
      cache: 'no-store',
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Failed to create article' }, { status: 502 });
  }
}
