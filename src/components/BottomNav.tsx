'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Home, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Search',
      icon: Search,
      path: '/',
      isActive: pathname === '/',
    },
    {
      label: 'Home',
      icon: Home,
      path: '/',
      isActive: pathname === '/',
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile', // Placeholder - update when profile page exists
      isActive: pathname === '/profile',
    },
  ];

  const handleNavClick = (path: string) => {
    if (path === '/profile') {
      // Placeholder - implement profile navigation when ready
      return;
    }
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-inset-bottom">
      <div className="glass border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 min-w-[60px] transition-all ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-slate-400 active:text-emerald-400'
                }`}
                aria-label={item.label}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-emerald-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
