'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ArticleBody from '../../../components/ArticleBody';
import { api, Article } from '../../../lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.getArticle(slug).then(setArticle).catch(() => setError('Article not found.'));
  }, [slug]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="mt-4 inline-block text-green-500 hover:text-green-400">← Back</Link>
      </div>
    );
  }

  if (!article) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-neutral-600 animate-pulse">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-neutral-600 hover:text-green-500 transition-colors mb-6 inline-block">
        ← Back to news
      </Link>
      <h1 className="text-3xl font-bold text-green-300 mb-2">{article.title}</h1>
      <div className="text-xs text-neutral-600 mb-8">
        By <span className="text-neutral-500">{article.author_username}</span> · {formatDate(article.published_at)}
      </div>
      <div className="prose prose-invert max-w-none">
        <ArticleBody body={article.body ?? ''} />
      </div>
    </div>
  );
}
