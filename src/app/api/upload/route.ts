import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
const MAX_BYTES    = 8 * 1024 * 1024; // 8 MB

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookie = req.headers.get('cookie') ?? '';
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const user = await res.json();
    return user?.is_admin === true || user?.isAdmin === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ message: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  // Accept Blob/File — `File extends Blob`, works across Node versions
  if (!file || typeof file === 'string' || !(file as Blob).size) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 });
  }
  const blob = file as Blob & { name?: string };
  const mimeType = blob.type ?? '';
  const fileName = blob.name ?? 'upload';

  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ message: 'File type not allowed' }, { status: 400 });
  }

  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ message: 'File extension not allowed' }, { status: 400 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ message: 'File too large (max 8 MB)' }, { status: 413 });
  }

  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const safeName = `${randomBytes(12).toString('hex')}${ext}`;  await writeFile(join(uploadsDir, safeName), buffer);

  return NextResponse.json({ url: `/uploads/${safeName}` });
}
