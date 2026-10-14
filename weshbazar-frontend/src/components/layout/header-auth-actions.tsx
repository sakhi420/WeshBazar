'use client';

/**
 * Client-only auth actions for the app header.
 * Reads the global auth context and shows the appropriate controls:
 *  - signed-in → user name, account link, logout
 *  - anonymous → login link
 *  - checking → subtle skeleton
 *
 * Master prompt §7, §101, §491.
 */

import Link from 'next/link';
import { LogOut, Shield, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';

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
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="max-w-32 truncate">
          <Link href="/account" className="inline-flex items-center gap-1.5">
            <User className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{user.displayName}</span>
          </Link>
        </Button>
        {(user.role === 'MODERATOR' || user.role === 'ADMIN') && (
          <Button asChild variant="ghost" size="sm" aria-label="پنل مدیریت">
            <Link href="/admin" className="inline-flex items-center gap-1.5">
              <Shield className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">مدیریت</span>
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="خروج از حساب"
          onClick={() => void performLogout()}
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  // anonymous, unreachable → login entry
  return (
    <Button asChild variant="ghost" size="icon" aria-label="ورود به حساب">
      <Link href="/auth/login">
        <User aria-hidden />
      </Link>
    </Button>
  );
}