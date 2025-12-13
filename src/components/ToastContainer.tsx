'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/contexts/ToastContext';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || toasts.length === 0 || typeof document === 'undefined') {
    return null;
  }

  const toastContent = (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-3 px-4 sm:left-auto sm:translate-x-0 sm:right-6"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );

  // Use portal to render outside of layout hierarchy, preventing conflicts with Next.js portals
  return createPortal(toastContent, document.body);
}
