'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '../lib/api';

/** Rendered in the root layout. Redirects to /setup when no users exist yet. */
export default function SetupCheck() {
  const router = useRouter();

  useEffect(() => {
    api.setupStatus().then(({ needsSetup }) => {
      if (needsSetup) router.replace('/setup');
    }).catch(() => {/* API unreachable — silently skip */});
  }, [router]);

  return null;
}
