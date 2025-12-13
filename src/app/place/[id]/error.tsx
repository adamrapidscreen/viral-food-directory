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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        <div className="mb-4 text-6xl">😕</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Something went wrong!
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          We couldn't load the restaurant details. Please try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
