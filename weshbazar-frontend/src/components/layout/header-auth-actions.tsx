'use client';

/**
 * Client-only auth actions for the app header.
 * Reads the global auth context and shows the appropriate controls:
 *  - signed-in → account name/avatar that opens a menu (account, listings,
 *    favorites, admin for staff, logout)
 *  - anonymous → visible "log in" + "sign up" side by side
 *  - checking → subtle spinner
 *
 * Master prompt §7, §101, §491.
 */

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronDown, Heart, Loader2, LogOut, Shield, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/api';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchMyProfile } from '@/features/account/api';
import type { UserSummary } from '@/features/auth';

export function HeaderAuthActions() {
  const { status, user, performLogout } = useAuth();

  if (status === 'checking') {
    return (
      <span className="inline-flex size-touch items-center justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-label="در حال بررسی وضعیت حساب…" />
      </span>
    );
  }

  if (status === 'ready' && user) {
    return <AccountMenu user={user} onLogout={performLogout} />;
  }

  // anonymous → visible "log in" + "sign up" (NN/g: keep them together)
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/auth/login">ورود</Link>
      </Button>
      <Button asChild variant="default" size="sm">
        <Link href="/auth/register">ثبت‌نام</Link>
      </Button>
    </div>
  );
}

function AccountMenu({ user, onLogout }: { user: UserSummary; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileQuery = useQuery({
    queryKey: queryKeys.account.profile,
    queryFn: fetchMyProfile,
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // When the menu opens, move focus into it so keyboard users can reach items.
  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }, [open]);

  const isStaff = user.role === 'MODERATOR' || user.role === 'ADMIN';

  // Roving focus for ArrowUp / ArrowDown / Home / End inside the menu.
  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  }

  const itemClass =
    'flex w-full items-center gap-2 px-4 py-2.5 text-start text-ui text-foreground transition-colors duration-small hover:bg-primary-soft focus:bg-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="gap-1.5"
      >
        <Avatar name={user.displayName ?? ''} src={profileQuery.data?.avatarUrl ?? null} size="sm" />
        <span className="max-w-40 truncate" title={user.displayName}>
          {user.displayName}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </Button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="منوی حساب"
          onKeyDown={handleMenuKeyDown}
          className="absolute end-0 top-full z-drawer mt-1 w-52 overflow-hidden rounded-surface border border-border bg-surface shadow-lg"
        >
          <Link href="/account" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            حساب کاربری
          </Link>
          <Link href="/my-listings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <Tag className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            آگهی‌های من
          </Link>
          <Link href="/favorites" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <Heart className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            علاقه‌مندی‌ها
          </Link>
          {isStaff ? (
            <Link href="/admin" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Shield className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              پنل مدیریت
            </Link>
          ) : null}
          <div className="my-1 border-t border-border" aria-hidden />
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
          >
            <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            خروج از حساب
          </button>
        </div>
      ) : null}
    </div>
  );
}