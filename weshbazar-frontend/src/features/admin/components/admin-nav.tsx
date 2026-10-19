'use client';

/**
 * Admin navigation tabs — one row of links for the five admin surfaces.
 * The active route is highlighted; links use next/link for client-side
 * navigation without a full page reload.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'داشبورد' },
  { href: '/admin/listings', label: 'آگهی‌ها' },
  { href: '/admin/reports', label: 'گزارش‌ها' },
  { href: '/admin/users', label: 'کاربران' },
  { href: '/admin/taxonomy', label: 'دسته‌بندی‌ها' },
  { href: '/admin/locations', label: 'مکان‌ها' },
  { href: '/admin/audit', label: 'رویدادها' },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 overflow-x-auto" aria-label="پنل مدیریت">
      <ul className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/admin' && pathname.startsWith(tab.href));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap rounded-t-control px-4 py-2.5 text-ui font-medium transition-colors',
                  active
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}