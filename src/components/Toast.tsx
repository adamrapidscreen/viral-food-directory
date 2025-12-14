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
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <Info className="h-5 w-5 text-emerald-400" />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-emerald-500/10 border-emerald-500/30',
  };

  const textColors = {
    success: 'text-emerald-300',
    error: 'text-red-300',
    info: 'text-emerald-300',
  };

  return (
    <div
      className={`glass flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-md transition-all duration-300 ${bgColors[toast.type]} ${textColors[toast.type]}`}
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
