import { NextResponse } from 'next/server';

// This route handler takes priority over the /api/* rewrite in next.config.ts,
// so it is served directly by Next.js rather than proxied to the NestJS API.
//
// The launcher fetches this endpoint on startup to discover the addresses it
// needs without anything being baked into the compiled binary.

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    // Base URL of the NestJS API — used for auth and other API calls.
    // In production this is the internal Docker URL rewritten by Next.js;
    // the launcher uses the value returned here, not a hardcoded URL.
    apiUrl: (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, ''),

    // Game server address in "host:port" form sent to clients in play.pcgi.
    gameServer: process.env.GAME_SERVER ?? '127.0.0.1:2000',
  });
}
