import { NextRequest, NextResponse } from 'next/server';

// Route handler (takes priority over the /api/* rewrite in next.config.ts).
// Fetches articles server-side from NestJS so the response returned to the
// client has Access-Control-Allow-Origin: * rather than the NestJS-issued
// origin, which only allows the Next.js frontend — not the Tauri launcher.

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
    return NextResponse.json(data, {
      status: upstream.status,
      headers: CORS,
    });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch articles' }, {
      status: 502,
      headers: CORS,
    });
  }
}
