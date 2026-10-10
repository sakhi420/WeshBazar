'use client';

/**
 * Account view (master prompt §32) — profile card and account navigation.
 *
 * Session-gated like favorites: guests are routed to login with `next`
 * preserved; a session that dies between bootstrap and the profile fetch is
 * treated the same way. The card shows identity, verification state and
 * member-since, offers an inline display-name edit (PATCH /me returning the
 * fresh profile), and the nav list links to the signed-in surfaces.
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  ChevronLeft,
  CircleAlert,
  Heart,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
  Store,
  Tag,
} from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { toPersianDigits, useAuthBootstrap } from '@/features/auth';
import { INPUT_CLASS } from '@/features/auth/components';
import { formatMonthYear } from '@/features/listings';
import { ApiError, ApiErrorCode, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fetchMyProfile } from '../api';
import { formatRoleLabel, initialsFrom } from '../format';
import { useLogout, useUpdateProfile } from '../hooks';
import type { MyProfile } from '../types';

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/account')}`;

export function AccountView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, retry } = useAuthBootstrap();

  // No session → sign-in required before the account can be shown.
  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(LOGIN_HREF);
    }
  }, [status, router]);

  const profileQuery = useQuery({
    queryKey: queryKeys.account.profile,
    queryFn: fetchMyProfile,
    enabled: status === 'ready',
    staleTime: 30_000,
    retry: false,
  });

  // The session can die between bootstrap and the profile fetch.
  const sessionLost =
    profileQuery.isError &&
    profileQuery.error instanceof ApiError &&
    (profileQuery.error.status === 401 || profileQuery.error.isSessionTerminal);

  useEffect(() => {
    if (sessionLost) {
      router.replace(LOGIN_HREF);
    }
  }, [sessionLost, router]);

  if (status === 'checking') {
    return <SessionSpinner label="در حال بررسی نشست…" />;
  }

  if (status === 'unreachable') {
    return (
      <ErrorState
        title="ارتباط با سرور برقرار نشد"
        description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        onRetry={retry}
      />
    );
  }

  if (status === 'anonymous' || sessionLost) {
    // The effects above are redirecting to login.
    return <SessionSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  }

  if (profileQuery.isPending) {
    return <SessionSpinner label="در حال بارگیری پروفایل…" />;
  }

  if (profileQuery.isError) {
    const requestId =
      profileQuery.error instanceof ApiError ? profileQuery.error.requestId : undefined;
    return (
      <ErrorState
        requestId={requestId}
        description="بارگیری پروفایل ناموفق بود. دوباره تلاش کنید."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  return <ProfileContent profile={profileQuery.data} className={className} />;
}

// --- Profile card -------------------------------------------------------------

function ProfileContent({ profile, className }: { profile: MyProfile; className?: string }) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogout();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [nameError, setNameError] = useState<string | null>(null);

  function startEditingName() {
    setNameDraft(profile.displayName);
    setNameError(null);
    setEditingName(true);
  }

  function cancelEditingName() {
    setEditingName(false);
    setNameError(null);
  }

  function handleSaveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateProfile.isPending) return;
    const trimmed = nameDraft.trim();
    if (trimmed.length < NAME_MIN_LENGTH) {
      setNameError(`نام نمایشی باید حداقل ${toPersianDigits(NAME_MIN_LENGTH)} نویسه باشد.`);
      return;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      setNameError(`نام نمایشی نباید بیشتر از ${toPersianDigits(NAME_MAX_LENGTH)} نویسه باشد.`);
      return;
    }
    setNameError(null);
    updateProfile.mutate(
      { displayName: trimmed },
      {
        onSuccess: () => {
          setEditingName(false);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === ApiErrorCode.VALIDATION_ERROR) {
            const issue = error.fieldErrors.find((detail) => detail.field === 'displayName');
            setNameError(issue?.message ?? 'ذخیرهٔ نام نمایشی ناموفق بود.');
            return;
          }
          setNameError('ذخیرهٔ نام نمایشی ناموفق بود. دوباره تلاش کنید.');
        },
      },
    );
  }

  function handleLogout() {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        // Caches are already cleared by the hook; return to public browsing.
        router.replace('/');
      },
    });
  }

  return (
    <div className={cn('space-y-6', className)}>
      <section
        aria-label="پروفایل"
        className="rounded-card border border-border bg-surface p-4 sm:p-5"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-card-title font-bold text-primary"
          >
            {initialsFrom(profile.displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-card-title font-semibold text-foreground">{profile.displayName}</p>
              {profile.phoneVerified ? (
                <span className="inline-flex items-center gap-1 rounded-control bg-success/10 px-2 py-0.5 text-caption font-medium text-success">
                  <BadgeCheck aria-hidden className="size-3.5" />
                  تأییدشده
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-ui text-muted-foreground">
              <span dir="ltr">{profile.phone}</span>
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
              <span>{formatRoleLabel(profile.role)}</span>
              <span aria-hidden>·</span>
              <span>عضو از {formatMonthYear(profile.createdAt)}</span>
            </p>
          </div>
        </div>

        {!profile.phoneVerified ? (
          <p
            role="status"
            className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control border border-warning/30 bg-warning/5 px-3 py-2 text-ui text-foreground/90"
          >
            <CircleAlert aria-hidden className="size-4 shrink-0 text-warning" />
            <span>شمارهٔ تلفن شما هنوز تأیید نشده است.</span>
            <Link
              href="/auth/verify?next=%2Faccount"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              تأیید شمارهٔ تلفن
            </Link>
          </p>
        ) : null}

        <div className="mt-4 border-t border-border pt-4">
          {editingName ? (
            <form onSubmit={handleSaveName} noValidate className="space-y-2">
              <label
                htmlFor="account-display-name"
                className="block text-ui font-medium text-foreground"
              >
                نام نمایشی
              </label>
              <input
                id="account-display-name"
                value={nameDraft}
                onChange={(event) => {
                  setNameDraft(event.target.value);
                  if (nameError) setNameError(null);
                }}
                maxLength={NAME_MAX_LENGTH}
                disabled={updateProfile.isPending}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? 'account-display-name-error' : undefined}
                className={INPUT_CLASS}
              />
              {nameError ? (
                <p id="account-display-name-error" className="text-meta text-danger">
                  {nameError}
                </p>
              ) : (
                <p className="text-meta text-muted-foreground">
                  بین {toPersianDigits(NAME_MIN_LENGTH)} تا {toPersianDigits(NAME_MAX_LENGTH)}{' '}
                  نویسه.
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <Loader2 aria-hidden className="animate-spin" />
                  ) : null}
                  ذخیره
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditingName}
                  disabled={updateProfile.isPending}
                >
                  انصراف
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-ui font-medium text-foreground">نام نمایشی</p>
                <p className="truncate text-meta text-muted-foreground">{profile.displayName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={startEditingName}>
                ویرایش
              </Button>
            </div>
          )}
        </div>
      </section>

      <nav
        aria-label="ناوبری حساب"
        className="overflow-hidden rounded-card border border-border bg-surface"
      >
        <ul className="divide-y divide-border">
          <AccountLink
            href="/account/security"
            icon={<Lock aria-hidden className="size-4" />}
            title="امنیت حساب"
            description="رمز عبور، نشست‌های فعال و شمارهٔ تلفن"
          />
          <AccountLink
            href="/favorites"
            icon={<Heart aria-hidden className="size-4" />}
            title="علاقه‌مندی‌ها"
            description="آگهی‌های ذخیره‌شده"
          />
          <AccountLink
            href="/my-listings"
            icon={<Tag aria-hidden className="size-4" />}
            title="آگهی‌های من"
            description="مدیریت آگهی‌های ثبت‌شده"
          />
          <AccountLink
            href={`/seller/${profile.seller.slug}`}
            icon={<Store aria-hidden className="size-4" />}
            title="صفحهٔ فروشندهٔ من"
            description="نمای عمومی شما برای خریداران"
          />
          {profile.role !== 'USER' ? (
            <AccountLink
              href="/admin"
              icon={<ShieldCheck aria-hidden className="size-4" />}
              title="پنل مدیریت"
              description="بررسی آگهی‌ها، گزارش‌ها و کاربران"
            />
          ) : null}
        </ul>
      </nav>

      <Button
        variant="outline"
        className="w-full border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
        disabled={logoutMutation.isPending}
        onClick={handleLogout}
      >
        {logoutMutation.isPending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <LogOut aria-hidden />
        )}
        خروج از حساب
      </Button>
    </div>
  );
}

// --- Small building blocks ----------------------------------------------------

function SessionSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  );
}

interface AccountLinkProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}

function AccountLink({ href, icon, title, description }: AccountLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-small hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-muted/10 text-muted-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-ui font-medium text-foreground">{title}</span>
          <span className="block truncate text-caption text-muted-foreground">{description}</span>
        </span>
        <ChevronLeft aria-hidden className="size-4 shrink-0 text-muted" />
      </Link>
    </li>
  );
}
