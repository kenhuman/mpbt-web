'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailErr, setEmailErr] = useState('');

  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) setEmail(user.email);
  }, [user, loading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr(''); setEmailMsg('');
    try {
      await api.updateEmail(email);
      await refresh();
      setEmailMsg('Email updated.');
    } catch (err) { setEmailErr((err as Error).message); }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pw.next.length < 8) { setPwErr('New password must be at least 8 characters.'); return; }
    try {
      await api.updatePassword(pw.current, pw.next);
      setPwMsg('Password changed.');
      setPw({ current: '', next: '' });
    } catch (err) { setPwErr((err as Error).message); }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-green-400 mb-1">Profile</h1>
        <p className="text-neutral-500 text-sm">{user.username}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-neutral-300 mb-4">Update Email</h2>
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="New email address"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-green-600"
            required
          />
          {emailErr && <p className="text-red-400 text-sm">{emailErr}</p>}
          {emailMsg && <p className="text-green-400 text-sm">{emailMsg}</p>}
          <button type="submit" className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors text-sm font-semibold">
            Save Email
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-300 mb-4">Change Password</h2>
        <form onSubmit={handlePwSubmit} className="space-y-3">
          <input
            type="password"
            value={pw.current}
            onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            placeholder="Current password"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-green-600"
            required
          />
          <input
            type="password"
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            placeholder="New password (8+ characters)"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-green-600"
            required
          />
          {pwErr && <p className="text-red-400 text-sm">{pwErr}</p>}
          {pwMsg && <p className="text-green-400 text-sm">{pwMsg}</p>}
          <button type="submit" className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors text-sm font-semibold">
            Change Password
          </button>
        </form>
      </section>
    </div>
  );
}
