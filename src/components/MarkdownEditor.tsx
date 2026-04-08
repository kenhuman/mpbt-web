'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import ArticleBody from './ArticleBody';

// SSR must be disabled — the editor accesses browser APIs on mount.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

// ── Upload helper ─────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Upload failed (${res.status})`);
  }
  const { url } = await res.json();
  return url as string;
}

// ── Image insertion dialog ────────────────────────────────────────────────────

interface ImageDialogProps {
  onInsert: (url: string, alt: string) => void;
  onClose: () => void;
}

function ImageDialog({ onInsert, onClose }: ImageDialogProps) {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUrlInsert = () => {
    if (!url.trim()) return;
    onInsert(url.trim(), alt.trim());
  };

  const doUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const uploadedUrl = await uploadFile(file);
      onInsert(uploadedUrl, alt.trim() || file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg p-5 w-80 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-neutral-300 mb-3">Insert Image</h3>

        <label className="block text-xs text-neutral-500 mb-1">Alt text</label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Image description"
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 mb-3 focus:outline-none focus:border-yellow-600"
        />

        <div className="flex gap-2 mb-3">
          {(['url', 'upload'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tab === t
                  ? 'bg-yellow-600 text-black font-semibold'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {t === 'url' ? 'By URL' : 'Upload'}
            </button>
          ))}
        </div>

        {tab === 'url' ? (
          <>
            <label className="block text-xs text-neutral-500 mb-1">Image URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 mb-3 focus:outline-none focus:border-yellow-600"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUrlInsert}
                disabled={!url.trim()}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-black text-sm font-semibold px-4 py-1.5 rounded transition-colors"
              >
                Insert
              </button>
            </div>
          </>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            {uploadError && <p className="text-red-400 text-xs mb-2">{uploadError}</p>}
            {uploading ? (
              <div className="border-2 border-dashed border-neutral-600 rounded p-6 text-center">
                <p className="text-sm text-neutral-400">Uploading…</p>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-yellow-500 bg-yellow-900/20'
                    : 'border-neutral-600 hover:border-neutral-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto mb-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-neutral-400">
                  {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-neutral-600 mt-1">JPG, PNG, GIF, WebP, SVG · max 8 MB</p>
              </div>
            )}
            <div className="flex justify-end mt-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (value: string) => void;
  editorHeight?: number;
}

export default function MarkdownEditor({ value, onChange, editorHeight = 400 }: Props) {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const insertImage = (url: string, alt: string) => {
    const tag = `![${alt}](${url})`;
    const sep = value && !value.endsWith('\n') ? '\n\n' : value.endsWith('\n\n') ? '' : '\n';
    onChange(value + sep + tag);
    setShowImageDialog(false);
  };

  return (
    <div data-color-mode="dark">
      {/* Image button row */}
      <div className="flex justify-end mb-1">
        <button
          type="button"
          onClick={() => setShowImageDialog(true)}
          title="Insert image"
          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Image
        </button>
      </div>

      {/* Source editor — MDEditor provides the toolbar */}
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        preview="edit"
        height={editorHeight}
        visibleDragbar={false}
        style={{ backgroundColor: '#171717' }}
      />

      {/* Live preview below at article width */}
      <div className="flex items-center gap-3 mt-5 mb-4">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Preview</span>
        <div className="flex-1 border-t border-neutral-800" />
      </div>

      <div className="max-w-3xl">
        {value.trim() ? (
          <ArticleBody body={value} />
        ) : (
          <p className="text-neutral-600 text-sm italic">Nothing to preview yet…</p>
        )}
      </div>

      {showImageDialog && (
        <ImageDialog onInsert={insertImage} onClose={() => setShowImageDialog(false)} />
      )}
    </div>
  );
}
