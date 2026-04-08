'use client';

import { useEffect, useState } from 'react';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface Release {
  tag_name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

function formatBytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function assetLabel(name: string): string | null {
  if (name.endsWith('.msi')) return 'MSI Package';
  if (name.includes('setup') && name.endsWith('.exe')) return 'Installer (recommended)';
  return null;
}

export default function DownloadPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://api.github.com/repos/kenhuman/mpbt-launcher/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No release found');
        return r.json() as Promise<Release>;
      })
      .then(setRelease)
      .catch(() => setError('Could not load release information. Check back soon.'));
  }, []);

  const installAssets = release?.assets.filter((a) => assetLabel(a.name) !== null) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-green-400 mb-1">Download Launcher</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        The MPBT Launcher connects you to the Solaris VII revival server.
      </p>

      {error && (
        <div className="border border-red-800 rounded-lg p-6 text-red-400 text-sm">{error}</div>
      )}
      {!release && !error && (
        <p className="text-neutral-600 animate-pulse">Loading…</p>
      )}

      {release && (
        <div className="border border-neutral-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-green-400 font-semibold text-lg">{release.tag_name}</span>
              <span className="text-neutral-600 text-sm ml-3">
                Released {formatDate(release.published_at)}
              </span>
            </div>
            <a
              href={release.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-neutral-500 hover:text-green-400 transition-colors"
            >
              View on GitHub →
            </a>
          </div>

          {installAssets.length === 0 ? (
            <p className="text-neutral-500 text-sm">No installer assets found for this release.</p>
          ) : (
            <ul className="space-y-3">
              {installAssets.map((asset) => (
                <li key={asset.name}>
                  <a
                    href={asset.browser_download_url}
                    className="flex items-center justify-between bg-neutral-900 border border-neutral-700 hover:border-green-700 rounded-lg px-4 py-3 transition-colors group"
                  >
                    <div>
                      <p className="text-green-300 font-medium group-hover:text-green-200 transition-colors">
                        {assetLabel(asset.name)}
                      </p>
                      <p className="text-neutral-500 text-xs mt-0.5">{asset.name}</p>
                    </div>
                    <div className="text-right text-xs text-neutral-600">
                      <p>{formatBytes(asset.size)}</p>
                      <p className="text-green-700 group-hover:text-green-500 mt-0.5">Download ↓</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-neutral-800 pt-4 text-sm space-y-2">
            <p className="font-medium text-neutral-400">After installing:</p>
            <ol className="list-decimal list-inside space-y-1 text-neutral-500">
              <li>Run <span className="text-neutral-300">MPBT Launcher</span> and log in with your account.</li>
              <li>If needed, set the path to <span className="text-neutral-300">MPBTWIN.EXE</span> under Advanced.</li>
              <li>Click <span className="text-neutral-300">Launch</span> — the game will connect to the server.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
