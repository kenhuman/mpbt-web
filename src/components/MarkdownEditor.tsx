'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

// SSR must be disabled — the editor accesses browser APIs on mount.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUrlInsert = () => {
    if (!url.trim()) return;
    onInsert(url.trim(), alt.trim());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Upload failed');
      }
      const { url: uploadedUrl } = await res.json();
      onInsert(uploadedUrl, alt.trim() || file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg p-5 w-80 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-neutral-300 mb-3">Insert Image</h3>

        {/* Alt text (shared) */}
        <label className="block text-xs text-neutral-500 mb-1">Alt text</label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Image description"
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 mb-3 focus:outline-none focus:border-yellow-600"
        />

        {/* Tabs */}
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
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300"
              >
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            {uploadError && <p className="text-red-400 text-xs mb-2">{uploadError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-black text-sm font-semibold px-4 py-1.5 rounded transition-colors"
              >
                {uploading ? 'Uploading…' : 'Choose File'}
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
  minHeight?: number;
}

export default function MarkdownEditor({ value, onChange, minHeight = 320 }: Props) {
  const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg');
  const [showImageDialog, setShowImageDialog] = useState(false);

  const insertImage = (url: string, alt: string) => {
    const tag = `![${alt}](${url})`;
    // Append at end with a blank line separator if body is non-empty.
    const sep = value && !value.endsWith('\n') ? '\n\n' : value.endsWith('\n\n') ? '' : '\n';
    onChange(value + sep + tag);
    setShowImageDialog(false);
  };

  return (
    <div data-color-mode="dark">
      {/* Toolbar row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('wysiwyg')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mode === 'wysiwyg'
                ? 'bg-yellow-600 text-black font-semibold'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('source')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mode === 'source'
                ? 'bg-yellow-600 text-black font-semibold'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            Source
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowImageDialog(true)}
          title="Insert image"
          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          Image
        </button>
      </div>

      {mode === 'wysiwyg' ? (
        <MDEditor
          value={value}
          onChange={(v) => onChange(v ?? '')}
          preview="live"
          height={minHeight}
          visibleDragbar={false}
          style={{ backgroundColor: '#171717' }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight }}
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-yellow-600 font-mono text-sm resize-y"
          spellCheck={false}
        />
      )}

      {showImageDialog && (
        <ImageDialog
          onInsert={insertImage}
          onClose={() => setShowImageDialog(false)}
        />
      )}
    </div>
  );
}
