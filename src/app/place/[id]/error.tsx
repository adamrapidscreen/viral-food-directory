'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to error reporting service
    console.error('Place detail page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">😕</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">
          Something went wrong!
        </h1>
        <p className="mb-6 text-slate-400">
          We couldn't load the restaurant details. Please try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2 font-semibold text-slate-300 transition-colors hover:bg-surface-solid/50"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
