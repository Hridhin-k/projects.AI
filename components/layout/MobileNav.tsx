"use client";

import { useState } from 'react';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface MobileNavProps {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  userName: string;
  userEmail: string | null;
  onLogout: () => void;
}

export default function MobileNav({
  navItems,
  isActive,
  userName,
  userEmail,
  onLogout,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-purple-800/20 bg-gray-900 shadow-xl lg:hidden">
            <nav className="container mx-auto space-y-1 px-4 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium ${
                    isActive(item.href)
                      ? 'bg-purple-800/25 text-purple-200'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-gray-700/50 px-4 py-3">
                <p className="font-medium text-white">{userName}</p>
                {userEmail && <p className="text-xs text-gray-400">{userEmail}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="mt-2 w-full rounded-lg border border-red-900/40 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-900/20"
              >
                Sign out
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
