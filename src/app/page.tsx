'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Article } from '../lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getArticles(5)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-green-400 mb-1">News &amp; Updates</h1>
      <p className="text-neutral-500 mb-8 text-sm">Latest from the Solaris VII Revival community</p>

      {loading && (
        <p className="text-neutral-600 animate-pulse">Loading…</p>
      )}

      {!loading && articles.length === 0 && (
        <div className="border border-neutral-800 rounded-lg p-8 text-center text-neutral-600">
          No posts yet. Check back soon.
        </div>
      )}

      <ul className="space-y-6">
        {articles.map((a) => (
          <li key={a.id} className="border border-neutral-800 rounded-lg p-5 hover:border-green-800 transition-colors">
            <Link href={`/articles/${a.slug}`}>
              <h2 className="text-lg font-semibold text-green-300 hover:text-green-200 mb-1">
                {a.title}
              </h2>
            </Link>
            <p className="text-neutral-400 text-sm mb-3 leading-relaxed">{a.summary}</p>
            <div className="flex items-center gap-3 text-xs text-neutral-600">
              <span>{a.author_username}</span>
              <span>·</span>
              <span>{formatDate(a.published_at)}</span>
              <Link href={`/articles/${a.slug}`} className="ml-auto text-green-700 hover:text-green-500 transition-colors">
                Read more →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
