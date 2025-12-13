import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        <div className="mb-4 text-6xl">🍜</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Restaurant Not Found
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The restaurant you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
