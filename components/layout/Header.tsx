"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import MobileNav from './MobileNav';
import type { UserRole } from '@/lib/db/schema';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  organizationName?: string;
}

export default function Header({
  userName,
  userEmail,
  userRole,
  organizationName,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const displayName = userName || userEmail?.split('@')[0] || 'User';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const allNavItems = [
    { href: '/projects', label: 'Projects', icon: '🚀' },
    { href: '/dashboard', label: 'All Tasks', icon: '📋' },
    { href: '/members', label: 'Members', icon: '👥' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  const platformNavItems = [{ href: '/platform', label: 'Platform', icon: '🛡️' }];

  const navItems = isSuperAdmin
    ? platformNavItems
    : userRole === 'EMPLOYEE'
      ? allNavItems.filter((item) => item.href !== '/members')
      : allNavItems;

  const isActive = (href: string) =>
    pathname === href ||
    (href === '/projects' && pathname.startsWith('/projects')) ||
    (href === '/platform' && pathname.startsWith('/platform'));

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-purple-800/20 bg-gray-900/95 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:gap-8">
            <Link href={isSuperAdmin ? "/platform" : "/projects"} className="group flex min-w-0 shrink-0 items-center gap-2">
              <h1 className="truncate text-lg font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent sm:text-xl">
                projects.ai
              </h1>
              <span className="hidden text-xs text-gray-400 sm:inline">
                {isSuperAdmin ? "Platform admin" : "AI project management"}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-purple-800/20 text-purple-200 border border-purple-700/30'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <MobileNav
              navItems={navItems}
              isActive={isActive}
              userName={displayName}
              userEmail={userEmail ?? null}
              onLogout={handleLogout}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="max-w-[160px] truncate text-sm font-medium text-gray-200">{displayName}</p>
              {organizationName && (
                <p className="max-w-[160px] truncate text-xs text-gray-400">{organizationName}</p>
              )}
            </div>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-teal-700 text-sm font-bold text-white md:flex">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-lg border border-gray-700/50 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-purple-700/30 hover:bg-gray-800/50 hover:text-gray-200 lg:inline-flex"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
