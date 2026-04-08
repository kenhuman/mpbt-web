import { NextResponse } from 'next/server';

// This route handler takes priority over the /api/* rewrite in next.config.ts,
// so it is served directly by Next.js rather than proxied to the NestJS API.
//
// The launcher fetches this endpoint on startup to discover the addresses it
// needs without anything being baked into the compiled binary.

export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*' };

export function GET() {
  return NextResponse.json({
    apiUrl: (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, ''),
    gameServer: process.env.GAME_SERVER ?? '127.0.0.1:2000',
  }, { headers: CORS });
}
