import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

/** Admin-only: returns all articles including drafts. */
export async function GET(req: NextRequest) {
  try {
    const upstream = await fetch(`${API_URL}/articles/admin`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch articles' }, { status: 502 });
  }
}
