import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">🍜</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">
          Restaurant Not Found
        </h1>
        <p className="mb-6 text-slate-400">
          The restaurant you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
