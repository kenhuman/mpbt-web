'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import MarkdownEditor from '../../components/MarkdownEditor';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ title: '', summary: '', body: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push('/');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    setSubmitting(true);
    try {
      const a = await api.createArticle(form);
      setSuccessMsg(`Article "${a.title}" published.`);
      setForm({ title: '', summary: '', body: '' });
    } catch (err) {
      setError((err as Error).message || 'Failed to publish.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user?.isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">Admin</h1>
        <Link
          href="/admin/users"
          className="text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 px-3 py-1.5 rounded transition-colors"
        >
          Manage Users →
        </Link>
      </div>
      <h2 className="text-lg font-semibold text-neutral-400 mb-4">Post Article</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-yellow-600"
            required
            minLength={3}
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Summary</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-yellow-600 resize-none"
            required
            minLength={10}
            maxLength={500}
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Body</label>
          <MarkdownEditor
            value={form.body}
            onChange={(v) => setForm((f) => ({ ...f, body: v }))}
            minHeight={380}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {successMsg && <p className="text-green-400 text-sm">{successMsg}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold px-6 py-2 rounded transition-colors"
        >
          {submitting ? 'Publishing…' : 'Publish Article'}
        </button>
      </form>
    </div>
  );
}
