'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import MarkdownEditor from '../../components/MarkdownEditor';
import { api, Article } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

type FormState = { title: string; summary: string; body: string };
const EMPTY_FORM: FormState = { title: '', summary: '', body: '' };

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push('/');
  }, [user, loading, router]);

  const loadArticles = useCallback(async () => {
    try {
      const list = await api.getAdminArticles();
      setArticles(list);
    } catch {
      // silently ignore — user may not have articles yet
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user?.isAdmin) loadArticles();
  }, [loading, user, loadArticles]);

  const startEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({ title: article.title, summary: article.summary, body: article.body ?? '' });
    setSuccessMsg('');
    setError('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccessMsg('');
  };

  const handleDelete = async (article: Article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteArticle(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete article.');
    }
  };

  const handleSubmit = async (published: boolean) => {
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (editingId !== null) {
        await api.updateArticle(editingId, { ...form, published });
        setSuccessMsg('Article updated.');
        setEditingId(null);
      } else {
        const a = await api.createArticle({ ...form, published });
        setSuccessMsg(`"${a.title}" ${published ? 'published' : 'saved as draft'}.`);
      }
      setForm(EMPTY_FORM);
      await loadArticles();
    } catch (err) {
      setError((err as Error).message || 'Failed to save article.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user?.isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-yellow-400">Admin</h1>
        <Link
          href="/admin/users"
          className="text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 px-3 py-1.5 rounded transition-colors"
        >
          Manage Users →
        </Link>
      </div>

      {/* Article list */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-neutral-400 mb-3">Articles</h2>
        {loadingArticles ? (
          <p className="text-neutral-600 text-sm animate-pulse">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="text-neutral-600 text-sm">No articles yet.</p>
        ) : (
          <div className="border border-neutral-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Title</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {articles.map((article, i) => (
                  <tr
                    key={article.id}
                    className={`border-t border-neutral-800 ${i % 2 === 0 ? 'bg-neutral-950' : 'bg-neutral-900/30'}`}
                  >
                    <td className="px-4 py-2.5 text-neutral-200 max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          article.published
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">{formatDate(article.created_at)}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => startEdit(article)}
                        className="text-xs text-yellow-500 hover:text-yellow-400 mr-4 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(article)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit form */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-400">
            {editingId !== null ? 'Edit Article' : 'New Article'}
          </h2>
          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ✕ Cancel edit
            </button>
          )}
        </div>

        <div className="space-y-5">
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
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {successMsg && <p className="text-green-400 text-sm">{successMsg}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting || !form.title.trim() || !form.summary.trim()}
              onClick={() => handleSubmit(false)}
              className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-neutral-100 font-semibold px-5 py-2 rounded transition-colors"
            >
              {submitting ? 'Saving…' : editingId !== null ? 'Update Draft' : 'Save as Draft'}
            </button>
            <button
              type="button"
              disabled={submitting || !form.title.trim() || !form.summary.trim()}
              onClick={() => handleSubmit(true)}
              className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold px-5 py-2 rounded transition-colors"
            >
              {submitting ? 'Saving…' : editingId !== null ? 'Update & Publish' : 'Publish'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

