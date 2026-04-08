import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.text();
    const upstream = await fetch(`${API_URL}/articles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      body,
      cache: 'no-store',
    });
    if (upstream.status === 204) return new NextResponse(null, { status: 204 });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Failed to update article' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const upstream = await fetch(`${API_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    return new NextResponse(null, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Failed to delete article' }, { status: 502 });
  }
}
