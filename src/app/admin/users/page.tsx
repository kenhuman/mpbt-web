'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { api, AdminUser } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

function Badge({ label, active, activeClass }: { label: string; active: boolean; activeClass: string }) {
  if (!active) return null;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${activeClass}`}>
      {label}
    </span>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Edit state: keyed by user id
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    email: string;
    password: string;
    isAdmin: boolean;
    suspended: boolean;
    banned: boolean;
  }>({ email: '', password: '', isAdmin: false, suspended: false, banned: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Create state
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', email: '', isAdmin: false });
  const [createError, setCreateError] = useState('');
  const [createSaving, setCreateSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api
      .listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setFetching(false));
  }, [user]);

  const openEdit = (u: AdminUser) => {
    setEditing(u.id);
    setSaveError('');
    setEditForm({
      email: u.email ?? '',
      password: '',
      isAdmin: u.is_admin,
      suspended: u.suspended,
      banned: u.banned,
    });
  };

  const saveEdit = async (targetId: number) => {
    setSaveError('');
    setSaving(true);
    try {
      const payload: Parameters<typeof api.updateUser>[1] = {
        isAdmin: editForm.isAdmin,
        suspended: editForm.suspended,
        banned: editForm.banned,
      };
      if (editForm.email.trim()) payload.email = editForm.email.trim();
      if (editForm.password.trim()) payload.password = editForm.password.trim();

      const updated = await api.updateUser(targetId, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
    } catch (err) {
      setSaveError((err as Error).message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const submitCreate = async () => {
    setCreateError('');
    setCreateSaving(true);
    try {
      const payload: Parameters<typeof api.createUser>[0] = {
        username: createForm.username.trim(),
        password: createForm.password,
      };
      if (createForm.email.trim()) payload.email = createForm.email.trim();
      if (createForm.isAdmin) payload.isAdmin = true;
      const newUser = await api.createUser(payload);
      setUsers((prev) => [...prev, newUser]);
      setCreating(false);
      setCreateForm({ username: '', password: '', email: '', isAdmin: false });
    } catch (err) {
      setCreateError((err as Error).message || 'Creation failed.');
    } finally {
      setCreateSaving(false);
    }
  };

  // Quick-toggle helpers (no modal needed)
  const quickToggle = async (
    u: AdminUser,
    field: 'suspended' | 'banned' | 'isAdmin',
  ) => {
    try {
      const updated = await api.updateUser(u.id, {
        [field === 'isAdmin' ? 'isAdmin' : field]: !u[field === 'isAdmin' ? 'is_admin' : field],
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading || !user?.isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">User Management</h1>
          <p className="text-neutral-500 text-sm">{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <a href="/admin" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
          ← Admin home
        </a>
        <button
          onClick={() => { setCreating((v) => !v); setCreateError(''); }}
          className="text-sm bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-3 py-1.5 rounded transition-colors"
        >
          {creating ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {creating && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-300">New User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-yellow-600"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-yellow-600"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Email <span className="text-neutral-600">(optional)</span></label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-yellow-600"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={createForm.isAdmin}
              onChange={(e) => setCreateForm((f) => ({ ...f, isAdmin: e.target.checked }))}
              className="accent-yellow-500"
            />
            <span className="text-neutral-300">Admin</span>
          </label>
          {createError && <p className="text-red-400 text-xs">{createError}</p>}
          <button
            onClick={submitCreate}
            disabled={createSaving || !createForm.username.trim() || !createForm.password}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black text-sm font-bold px-4 py-1.5 rounded transition-colors"
          >
            {createSaving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      )}

      {fetching && <p className="text-neutral-600 animate-pulse">Loading…</p>}

      {!fetching && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-neutral-500 text-xs uppercase">
                <th className="text-left py-2 px-3 border-b border-neutral-800">User</th>
                <th className="text-left py-2 px-3 border-b border-neutral-800">Email</th>
                <th className="text-left py-2 px-3 border-b border-neutral-800">Status</th>
                <th className="text-left py-2 px-3 border-b border-neutral-800">Joined</th>
                <th className="text-left py-2 px-3 border-b border-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <React.Fragment key={u.id}>
                  <tr className="hover:bg-neutral-900/50 transition-colors">
                    <td className="py-3 px-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-200">{u.username}</span>
                        <Badge label="Admin" active={u.is_admin} activeClass="bg-yellow-900 text-yellow-300" />
                      </div>
                      <span className="text-neutral-600 text-xs">#{u.id}</span>
                    </td>
                    <td className="py-3 px-3 align-top text-neutral-400">{u.email ?? '—'}</td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex gap-1 flex-wrap">
                        {!u.banned && !u.suspended && (
                          <span className="text-xs text-green-600">Active</span>
                        )}
                        <Badge label="Suspended" active={u.suspended} activeClass="bg-orange-900 text-orange-300" />
                        <Badge label="Banned" active={u.banned} activeClass="bg-red-900 text-red-300" />
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top text-neutral-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 align-top">
                      {editing === u.id ? (
                        <button
                          onClick={() => setEditing(null)}
                          className="text-xs text-neutral-500 hover:text-neutral-300"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>

                  {editing === u.id && (
                    <tr>
                      <td colSpan={5} className="px-3 pb-4">
                        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Email</label>
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-yellow-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                New Password <span className="text-neutral-600">(leave blank to keep)</span>
                              </label>
                              <input
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-yellow-600"
                              />
                            </div>
                          </div>

                          <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.isAdmin}
                                onChange={(e) => setEditForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                                disabled={u.username === user.username ? true : false}
                                className="accent-yellow-500"
                              />
                              <span className={u.username === user.username ? 'text-neutral-600' : 'text-neutral-300'}>
                                Admin {u.username === user.username && '(cannot change own)'}
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.suspended}
                                onChange={(e) => setEditForm((f) => ({ ...f, suspended: e.target.checked }))}
                                disabled={u.username === user.username ? true : false}
                                className="accent-orange-500"
                              />
                              <span className={u.username === user.username ? 'text-neutral-600' : 'text-neutral-300'}>
                                Suspended
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.banned}
                                onChange={(e) => setEditForm((f) => ({ ...f, banned: e.target.checked }))}
                                disabled={u.username === user.username ? true : false}
                                className="accent-red-500"
                              />
                              <span className={u.username === user.username ? 'text-neutral-600' : 'text-neutral-300'}>
                                Banned
                              </span>
                            </label>
                          </div>

                          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

                          <button
                            onClick={() => saveEdit(u.id)}
                            disabled={saving}
                            className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black text-sm font-bold px-4 py-1.5 rounded transition-colors"
                          >
                            {saving ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <p className="text-neutral-600 py-8 text-center">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
