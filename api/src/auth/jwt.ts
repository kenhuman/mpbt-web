import * as crypto from 'crypto';

export interface JwtPayload {
  sub: number;      // account id
  username: string;
  isAdmin: boolean;
}

// HS256 JWT — uses JWT_SECRET from env (falls back to a random secret per process).
const SECRET = process.env.JWT_SECRET ?? crypto.randomBytes(32).toString('hex');
const EXPIRY  = '7d';

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signJwt(payload: JwtPayload): string {
  const header  = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body    = base64url(Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400, iat: Math.floor(Date.now() / 1000) })));
  const sig     = base64url(crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = base64url(crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString()) as JwtPayload & { exp: number };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: payload.sub, username: payload.username, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}
