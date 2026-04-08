'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold text-green-300 mt-8 mb-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-semibold text-green-400 mt-6 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold text-green-500 mt-4 mb-1">{children}</h3>,
            p: ({ children }) => <p className="text-neutral-300 leading-relaxed mb-4">{children}</p>,
            strong: ({ children }) => <strong className="text-neutral-100 font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-neutral-300">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-neutral-300">{children}</ol>,
            li: ({ children }) => <li className="ml-2">{children}</li>,
            a: ({ href, children }) => <a href={href} className="text-green-400 hover:text-green-300 underline">{children}</a>,
            code: ({ children }) => <code className="bg-neutral-800 text-green-300 px-1 rounded text-sm">{children}</code>,
            pre: ({ children }) => <pre className="bg-neutral-900 border border-neutral-700 rounded p-4 overflow-x-auto mb-4 text-sm">{children}</pre>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-green-700 pl-4 italic text-neutral-400 mb-4">{children}</blockquote>,
            hr: () => <hr className="border-neutral-700 my-6" />,
          }}
        >
          {article.body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
