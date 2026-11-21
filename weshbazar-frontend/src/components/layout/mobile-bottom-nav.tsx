'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Grid2X2, Heart, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';

const links = [
  { href: '/market', label: 'خانه', icon: Home },
  { href: '/search', label: 'جستجو', icon: Search },
  { href: '/categories', label: 'دسته‌ها', icon: Grid2X2 },
  { href: '/favorites', label: 'علاقه‌ها', icon: Heart },
] as const;

function isWithinPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isLinkActive(href: (typeof links)[number]['href'], pathname: string) {
  if (href === '/market') return pathname === '/market';
  if (href === '/categories') {
    return pathname === '/categories' || isWithinPath(pathname, '/category');
  }
  return isWithinPath(pathname, href);
}

function isAccountArea(pathname: string) {
  return ['/account', '/my-listings', '/seller', '/admin', '/auth'].some((path) =>
    isWithinPath(pathname, path),
  );
}

/**
 * Mobile bottom navigation.
 * Five equally sized primary destinations; staff tools remain in the account menu.
 * The 64px navigation row is extended by the device safe area on phones with a home indicator.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { status, user } = useAuth();

  const accountHref = status === 'ready' && user ? '/account' : '/auth/login';
  const accountActive = isAccountArea(pathname);

  return (
    <nav
      aria-label="ناوبری اصلی"
      className={cn(
        'fixed inset-x-0 bottom-0 z-header lg:hidden',
        'border-t border-border/80 bg-surface/95 shadow-[0_-6px_24px_rgba(18,52,48,0.07)]',
        'pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl',
      )}
      style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <ul className="grid h-full grid-cols-5 items-center gap-0 px-1 sm:px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isLinkActive(href, pathname);
          return (
            <li key={href} className="h-full min-w-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-full min-h-11 w-full min-w-0 flex-col items-center justify-center gap-0.5',
                  'rounded-xl px-0.5 py-1 text-[11px] leading-4 transition-colors duration-small',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  active ? 'font-bold text-primary' : 'font-medium text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-small',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground',
                  )}
                >
                  <Icon size={21} strokeWidth={active ? 2 : 1.8} aria-hidden />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}

        <li className="h-full min-w-0">
          <Link
            href={accountHref}
            aria-current={accountActive ? 'page' : undefined}
            className={cn(
              'group flex h-full min-h-11 w-full min-w-0 flex-col items-center justify-center gap-0.5',
              'rounded-xl px-0.5 py-1 text-[11px] leading-4 transition-colors duration-small',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
              accountActive ? 'font-bold text-primary' : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-small',
                accountActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground',
              )}
            >
              <UserRound size={21} strokeWidth={accountActive ? 2 : 1.8} aria-hidden />
            </span>
            <span className="whitespace-nowrap">حساب</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
