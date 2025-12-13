'use client';

import { useEffect } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    info: <Info className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-teal-800 dark:text-teal-200',
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-md transition-all duration-300 ${bgColors[toast.type]} ${textColors[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="rounded-lg p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
