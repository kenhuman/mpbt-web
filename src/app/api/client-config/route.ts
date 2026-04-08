import { NextResponse } from 'next/server';

// This route handler takes priority over the /api/* rewrite in next.config.ts,
// so it is served directly by Next.js rather than proxied to the NestJS API.
//
// The launcher fetches this endpoint on startup to discover the addresses it
// needs without anything being baked into the compiled binary.

export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*' };

export function GET() {
  // PUBLIC_API_URL is what the launcher (desktop client) uses — must be a
  // publicly reachable address.  API_URL is the internal Docker network URL
  // used by Next.js server-side rewrites and should never be sent to clients.
  const publicApiUrl = (
    process.env.PUBLIC_API_URL ??
    process.env.API_URL ??
    'http://localhost:3001'
  ).replace(/\/+$/, '');

  return NextResponse.json({
    apiUrl: publicApiUrl,
    gameServer: process.env.GAME_SERVER ?? '127.0.0.1:2000',
  }, { headers: CORS });
}
