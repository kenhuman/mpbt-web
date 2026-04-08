export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body?: string;
  author_id: number;
  author_username: string;
  published_at: string;
  created_at: string;
}

export interface User {
  username: string;
  email: string;
  isAdmin: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  suspended: boolean;
  banned: boolean;
  created_at: string;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error((body as { message?: string }).message ?? res.statusText), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getArticles: (limit = 5) => apiFetch<Article[]>(`/api/articles?limit=${limit}`),
  getArticle: (slug: string) => apiFetch<Article>(`/api/articles/${slug}`),
  createArticle: (data: { title: string; summary: string; body: string }) =>
    apiFetch<Article>('/api/articles', { method: 'POST', body: JSON.stringify(data) }),

  register: (data: { username: string; password: string; email: string }) =>
    apiFetch<{ username: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { username: string; password: string }) =>
    apiFetch<User>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<User>('/api/auth/me'),
  updateEmail: (email: string) =>
    apiFetch<void>('/api/auth/profile/email', { method: 'PATCH', body: JSON.stringify({ email }) }),
  updatePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<void>('/api/auth/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // First-time setup
  setupStatus: () => apiFetch<{ needsSetup: boolean }>('/api/setup/status'),
  runSetup: (data: { username: string; password: string; email: string }) =>
    apiFetch<{ username: string }>('/api/setup', { method: 'POST', body: JSON.stringify(data) }),

  // Admin user management
  listUsers: () => apiFetch<AdminUser[]>('/api/admin/users'),
  updateUser: (
    id: number,
    data: Partial<{ email: string; password: string; isAdmin: boolean; suspended: boolean; banned: boolean }>,
  ) => apiFetch<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
