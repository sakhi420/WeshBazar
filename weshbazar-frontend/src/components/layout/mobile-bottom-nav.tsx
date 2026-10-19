'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Grid3X3, Heart, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';

const links = [
  { href: '/', label: 'خانه', icon: Home },
  { href: '/search', label: 'جستجو', icon: Search },
  { href: '/categories', label: 'دسته‌ها', icon: Grid3X3 },
  { href: '/favorites', label: 'علاقه‌مندی‌ها', icon: Heart },
] as const;

/**
 * Mobile bottom navigation (§103, §458, §492).
 * 64-72px + safe area. Visible on screens < lg (768px).
 * The account tab links to /account when signed in, /auth/login otherwise.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { status, user } = useAuth();

  const accountHref = status === 'ready' ? '/account' : '/auth/login';
  const showAdmin = status === 'ready' && user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="lg:hidden fixed bottom-0 start-0 end-0 z-header border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)]"
      style={{ height: 'var(--bottom-nav)' }}
    >
      <ul className="flex h-full items-center justify-around px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-control px-2 py-1 min-w-touch text-caption transition-colors duration-small border-t-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('size-5', isActive && 'stroke-[1.5]')} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}

        {/* Admin tab — only for staff */}
        {showAdmin && (
          <li>
            <Link
              href="/admin"
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-control px-2 py-1 min-w-touch text-caption transition-colors duration-small border-t-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                pathname.startsWith('/admin')
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Shield
                className={cn('size-5', pathname.startsWith('/admin') && 'stroke-[1.5]')}
                aria-hidden
              />
              <span>مدیریت</span>
            </Link>
          </li>
        )}

        {/* Account tab — auth-aware */}
        <li>
          <Link
            href={accountHref}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-control px-2 py-1 min-w-touch text-caption transition-colors duration-small border-t-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              pathname.startsWith('/account') || pathname.startsWith('/auth/login')
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <User
              className={cn(
                'size-5',
                (pathname.startsWith('/account') || pathname.startsWith('/auth/login')) &&
                  'stroke-[1.5]',
              )}
              aria-hidden
            />
            <span>حساب</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}