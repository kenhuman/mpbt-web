import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import Header from '../components/Header';
import SetupCheck from '../components/SetupCheck';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MPBT — Solaris VII Revival',
  description: 'News and community hub for Multiplayer BattleTech',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ colorScheme: 'dark' }}>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-200">
        <AuthProvider>
          <SetupCheck />
          <Header />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
