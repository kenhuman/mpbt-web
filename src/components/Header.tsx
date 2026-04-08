'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-green-400 font-bold text-xl tracking-wider hover:text-green-300 transition-colors">
        MPBT
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/download" className="text-neutral-300 hover:text-green-400 transition-colors">
          Download
        </Link>
        {loading ? null : user ? (
          <>
            <Link href="/profile" className="text-neutral-300 hover:text-green-400 transition-colors">
              {user.username}
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-neutral-500 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-neutral-300 hover:text-green-400 transition-colors">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
