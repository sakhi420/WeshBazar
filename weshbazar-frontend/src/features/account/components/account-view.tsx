'use client';

/**
 * Account dashboard — identity, daily marketplace actions, seller storefront
 * settings, account security and support shortcuts.
 *
 * All profile writes use the frozen PATCH /me contract. No dashboard metrics
 * are fabricated; this view only exposes data returned by MyProfileDto.
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpLeft,
  BadgeCheck,
  Check,
  ChevronLeft,
  CircleAlert,
  CircleHelp,
  ExternalLink,
  Heart,
  Loader2,
  LockKeyhole,
  LogOut,
  Pencil,
  ShieldCheck,
  Store,
  Tag,
  X,
} from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toPersianDigits, useAuthBootstrap } from '@/features/auth';
import { INPUT_CLASS } from '@/features/auth/components';
import { formatMonthYear } from '@/features/listings';
import { ApiError, ApiErrorCode, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fetchMyProfile } from '../api';
import { formatRoleLabel } from '../format';
import { ProfilePhotoControls } from './profile-photo-controls';
import { useLogout, useUpdateProfile } from '../hooks';
import type { MyProfile } from '../types';

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const BIO_MAX_LENGTH = 500;
const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/account')}`;

export function AccountView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, retry } = useAuthBootstrap();

  useEffect(() => {
    if (status === 'anonymous') router.replace(LOGIN_HREF);
  }, [status, router]);

  const profileQuery = useQuery({
    queryKey: queryKeys.account.profile,
    queryFn: fetchMyProfile,
    enabled: status === 'ready',
    staleTime: 30_000,
    retry: false,
  });

  const sessionLost =
    profileQuery.isError &&
    profileQuery.error instanceof ApiError &&
    (profileQuery.error.status === 401 || profileQuery.error.isSessionTerminal);

  useEffect(() => {
    if (sessionLost) router.replace(LOGIN_HREF);
  }, [sessionLost, router]);

  if (status === 'checking') return <SessionSpinner label="در حال بررسی نشست…" />;

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
    return <SessionSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  }

  if (profileQuery.isPending) return <SessionSpinner label="در حال بارگیری حساب شما…" />;

  if (profileQuery.isError) {
    const requestId =
      profileQuery.error instanceof ApiError ? profileQuery.error.requestId : undefined;
    return (
      <ErrorState
        requestId={requestId}
        description="بارگیری حساب ناموفق بود. دوباره تلاش کنید."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  return <AccountDashboard profile={profileQuery.data} className={className} />;
}

// --- Dashboard ---------------------------------------------------------------

function AccountDashboard({ profile, className }: { profile: MyProfile; className?: string }) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogout();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [nameError, setNameError] = useState<string | null>(null);

  const [editingSeller, setEditingSeller] = useState(false);
  const [sellerNameDraft, setSellerNameDraft] = useState(profile.seller.displayName);
  const [sellerBioDraft, setSellerBioDraft] = useState(profile.seller.bio ?? '');
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editingName) setNameDraft(profile.displayName);
  }, [profile.displayName, editingName]);

  useEffect(() => {
    if (!editingSeller) {
      setSellerNameDraft(profile.seller.displayName);
      setSellerBioDraft(profile.seller.bio ?? '');
    }
  }, [profile.seller.displayName, profile.seller.bio, editingSeller]);

  function beginNameEdit() {
    setNameDraft(profile.displayName);
    setNameError(null);
    setSavedMessage(null);
    setEditingName(true);
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateProfile.isPending) return;

    const displayName = nameDraft.trim();
    if (displayName.length < NAME_MIN_LENGTH || displayName.length > NAME_MAX_LENGTH) {
      setNameError(
        `نام باید بین ${toPersianDigits(NAME_MIN_LENGTH)} تا ${toPersianDigits(NAME_MAX_LENGTH)} نویسه باشد.`,
      );
      return;
    }

    setNameError(null);
    setSavedMessage(null);
    updateProfile.mutate(
      { displayName },
      {
        onSuccess: () => {
          setEditingName(false);
          setSavedMessage('نام حساب با موفقیت به‌روز شد.');
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === ApiErrorCode.VALIDATION_ERROR) {
            const issue = error.fieldErrors.find((detail) => detail.field === 'displayName');
            setNameError(issue?.message ?? 'ذخیرهٔ نام ناموفق بود.');
            return;
          }
          setNameError('ذخیرهٔ نام ناموفق بود. دوباره تلاش کنید.');
        },
      },
    );
  }

  function beginSellerEdit() {
    setSellerNameDraft(profile.seller.displayName);
    setSellerBioDraft(profile.seller.bio ?? '');
    setSellerError(null);
    setSavedMessage(null);
    setEditingSeller(true);
  }

  function saveSeller(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateProfile.isPending) return;

    const displayName = sellerNameDraft.trim();
    const bio = sellerBioDraft.trim();

    if (displayName.length < NAME_MIN_LENGTH || displayName.length > NAME_MAX_LENGTH) {
      setSellerError(
        `نام فروشنده باید بین ${toPersianDigits(NAME_MIN_LENGTH)} تا ${toPersianDigits(NAME_MAX_LENGTH)} نویسه باشد.`,
      );
      return;
    }
    if (bio.length > BIO_MAX_LENGTH) {
      setSellerError(`معرفی فروشنده نباید بیشتر از ${toPersianDigits(BIO_MAX_LENGTH)} نویسه باشد.`);
      return;
    }

    setSellerError(null);
    setSavedMessage(null);
    updateProfile.mutate(
      { seller: { displayName, bio } },
      {
        onSuccess: () => {
          setEditingSeller(false);
          setSavedMessage('پروفایل فروشندگی با موفقیت به‌روز شد.');
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === ApiErrorCode.VALIDATION_ERROR) {
            const issue = error.fieldErrors.find((detail) =>
              detail.field === 'seller.displayName' || detail.field === 'seller.bio',
            );
            setSellerError(issue?.message ?? 'ذخیرهٔ پروفایل فروشندگی ناموفق بود.');
            return;
          }
          setSellerError('ذخیرهٔ پروفایل فروشندگی ناموفق بود. دوباره تلاش کنید.');
        },
      },
    );
  }

  function handleLogout() {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate(undefined, {
      onSettled: () => router.replace('/'),
    });
  }

  const sellerStatusLabel =
    profile.seller.status === 'ACTIVE'
      ? 'فعال'
      : profile.seller.status === 'SUSPENDED'
        ? 'تعلیق‌شده'
        : 'مسدودشده';

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      <header className="space-y-1">
        <p className="hidden text-meta font-semibold text-primary sm:block">فضای شخصی ویش‌بازار</p>
        <h1 className="text-heading font-black tracking-tight text-foreground">حساب من</h1>
        <p className="hidden text-ui text-muted-foreground sm:block">
          اطلاعات شخصی و فعالیت‌های خود را از همین‌جا مدیریت کن.
        </p>
      </header>

      <section
        aria-labelledby="account-identity-title"
        className="relative isolate overflow-hidden rounded-surface border border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/70 p-3.5 shadow-soft sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -end-12 -top-16 -z-10 size-44 rounded-full bg-primary/5 blur-2xl"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
            <Avatar
              name={profile.displayName}
              src={profile.avatarUrl ?? null}
              size="xl"
              className="size-14 text-card-title ring-4 ring-white shadow-soft sm:size-16 sm:text-heading"
            />
            <div className="min-w-0 flex-1">
              <p className="text-caption font-medium text-muted-foreground">خوش آمدی</p>
              <h2
                id="account-identity-title"
                className="mt-0.5 break-words text-ui font-black leading-6 text-foreground sm:text-section"
              >
                {profile.displayName}
              </h2>
              <p className="mt-0.5 text-caption text-muted-foreground sm:mt-1 sm:text-ui" dir="ltr">
                {profile.phone}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                {profile.phoneVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-caption sm:px-2.5 sm:py-1 font-semibold text-success">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    شماره تأییدشده
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-caption sm:px-2.5 sm:py-1 font-semibold text-warning">
                    <CircleAlert className="size-3.5" aria-hidden />
                    شماره تأییدنشده
                  </span>
                )}
                <span className="rounded-full border border-border/80 bg-white/70 px-2 py-0.5 text-caption sm:px-2.5 sm:py-1 font-medium text-muted-foreground">
                  {formatRoleLabel(profile.role)}
                </span>
              </div>
              <p className="mt-1.5 text-caption text-muted-foreground sm:mt-2">
                عضو از {formatMonthYear(profile.createdAt)}
              </p>
            </div>
          </div>

          <div className="w-full border-t border-primary/10 pt-3 sm:w-auto sm:border-0 sm:pt-0">
            <ProfilePhotoControls hasAvatar={Boolean(profile.avatarUrl)} />
          </div>
        </div>

        {!profile.phoneVerified ? (
          <div className="mt-3 flex flex-col gap-2 rounded-card sm:mt-4 border border-warning/25 bg-warning/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ui text-foreground/90">
              برای استفادهٔ مطمئن‌تر از حساب، شمارهٔ تلفن خود را تأیید کن.
            </p>
            <Link
              href="/auth/verify?next=%2Faccount"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 text-ui font-bold text-primary hover:underline"
            >
              تأیید شماره
              <ArrowUpLeft className="size-4" aria-hidden />
            </Link>
          </div>
        ) : null}

        <div className="mt-4 border-t border-primary/10 pt-4">
          {editingName ? (
            <form onSubmit={saveName} noValidate className="space-y-2.5">
              <label htmlFor="account-display-name" className="block text-ui font-semibold text-foreground">
                نام شخصی
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
                <p id="account-display-name-error" className="text-meta text-danger">{nameError}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button type="submit" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
                  ذخیره نام
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full sm:min-h-9 sm:w-auto"
                  disabled={updateProfile.isPending}
                  onClick={() => {
                    setEditingName(false);
                    setNameError(null);
                  }}
                >
                  <X className="size-4" aria-hidden />
                  انصراف
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0">
                <p className="text-ui font-semibold text-foreground">نام حساب</p>
                <p className="mt-0.5 hidden text-caption text-muted-foreground sm:block">این نام در اطلاعات حساب شخصی تو استفاده می‌شود.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-9" onClick={beginNameEdit}>
                <Pencil className="size-3.5" aria-hidden />
                ویرایش نام
              </Button>
            </div>
          )}
        </div>
      </section>

      {savedMessage ? (
        <p role="status" className="flex items-center gap-2 text-meta font-medium text-success">
          <Check className="size-4" aria-hidden />
          {savedMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4 sm:space-y-6">
          <section aria-labelledby="account-activity-title" className="space-y-3">
            <SectionHeading
              id="account-activity-title"
              title="فعالیت‌های من"
              description="دسترسی سریع به کارهای روزمره"
            />
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              <QuickAction
                href="/my-listings"
                title="آگهی‌های من"
                description="مدیریت و پیگیری آگهی‌ها"
                icon={<Tag className="size-5" aria-hidden />}
                tone="primary"
              />
              <QuickAction
                href="/favorites"
                title="علاقه‌مندی‌ها"
                description="آگهی‌های ذخیره‌شده"
                icon={<Heart className="size-5" aria-hidden />}
                tone="accent"
              />
            </div>
          </section>

          <section
            aria-labelledby="seller-profile-title"
            className="overflow-hidden rounded-surface border border-border bg-surface shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-3.5 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-primary-soft text-primary">
                  <Store className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 id="seller-profile-title" className="text-ui font-bold text-foreground">
                    پروفایل فروشندگی
                  </h2>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    نمایی که خریداران از تو می‌بینند
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-caption font-semibold',
                  profile.seller.status === 'ACTIVE'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning',
                )}
              >
                {sellerStatusLabel}
              </span>
            </div>

            <div className="space-y-3 p-3.5 sm:space-y-4 sm:p-5">
              {editingSeller ? (
                <form onSubmit={saveSeller} noValidate className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="seller-display-name" className="block text-ui font-semibold text-foreground">
                      نام نمایشی فروشنده
                    </label>
                    <input
                      id="seller-display-name"
                      value={sellerNameDraft}
                      onChange={(event) => {
                        setSellerNameDraft(event.target.value);
                        if (sellerError) setSellerError(null);
                      }}
                      maxLength={NAME_MAX_LENGTH}
                      disabled={updateProfile.isPending}
                      aria-invalid={sellerError ? true : undefined}
                      className={INPUT_CLASS}
                    />
                    <p className="text-caption text-muted-foreground">
                      این نام در صفحهٔ عمومی فروشنده نمایش داده می‌شود.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="seller-bio" className="block text-ui font-semibold text-foreground">
                      معرفی کوتاه
                    </label>
                    <textarea
                      id="seller-bio"
                      value={sellerBioDraft}
                      onChange={(event) => {
                        setSellerBioDraft(event.target.value);
                        if (sellerError) setSellerError(null);
                      }}
                      maxLength={BIO_MAX_LENGTH}
                      rows={3}
                      disabled={updateProfile.isPending}
                      className={cn(INPUT_CLASS, 'min-h-24 resize-y py-2.5')}
                      placeholder="کمی دربارهٔ خودت یا چیزهایی که می‌فروشی بنویس…"
                    />
                    <p className="text-end text-caption text-muted-foreground">
                      {toPersianDigits(sellerBioDraft.length)} از {toPersianDigits(BIO_MAX_LENGTH)}
                    </p>
                  </div>
                  {sellerError ? <p role="alert" className="text-meta text-danger">{sellerError}</p> : null}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Button type="submit" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
                      ذخیره پروفایل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 w-full sm:min-h-9 sm:w-auto"
                      disabled={updateProfile.isPending}
                      onClick={() => {
                        setEditingSeller(false);
                        setSellerError(null);
                      }}
                    >
                      <X className="size-4" aria-hidden />
                      انصراف
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar
                      name={profile.seller.displayName}
                      src={profile.avatarUrl ?? null}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-ui font-bold text-foreground">
                        {profile.seller.displayName}
                      </p>
                      <p className="mt-0.5 text-caption text-muted-foreground">
                        صفحهٔ فروشنده در ویش‌بازار
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={beginSellerEdit}>
                      <Pencil className="size-3.5" aria-hidden />
                      ویرایش
                    </Button>
                  </div>
                  {profile.seller.bio ? (
                    <p className="whitespace-pre-line break-words text-ui leading-6 text-muted-foreground">
                      {profile.seller.bio}
                    </p>
                  ) : (
                    <p className="rounded-card bg-muted/10 px-3 py-2.5 text-caption text-muted-foreground">
                      هنوز معرفی کوتاهی برای صفحهٔ فروشنده ننوشته‌ای.
                    </p>
                  )}
                  {profile.seller.status === 'ACTIVE' ? (
                    <Link
                      href={`/seller/${profile.seller.slug}`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-primary/20 bg-primary-soft/50 px-4 text-ui font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      مشاهده صفحهٔ عمومی
                      <ExternalLink className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      صفحهٔ عمومی فروشنده در حال حاضر فعال نیست.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="account-settings-title" className="space-y-3">
            <SectionHeading
              id="account-settings-title"
              title="حساب و پشتیبانی"
              description="تنظیمات و راهنمایی‌های موردنیاز"
            />
            <nav aria-label="تنظیمات و پشتیبانی" className="overflow-hidden rounded-surface border border-border bg-surface shadow-soft">
              <ul className="divide-y divide-border">
                <AccountLink
                  href="/account/security"
                  icon={<LockKeyhole className="size-4" aria-hidden />}
                  title="امنیت حساب"
                  description="رمز عبور، شماره تلفن و نشست‌ها"
                />
                <AccountLink
                  href="/contact"
                  icon={<CircleHelp className="size-4" aria-hidden />}
                  title="راهنما و پشتیبانی"
                  description="ارتباط با تیم ویش‌بازار"
                />
                <AccountLink
                  href="/help/safety"
                  icon={<ShieldCheck className="size-4" aria-hidden />}
                  title="راهنمای خرید و فروش امن"
                  description="نکته‌های ایمنی هنگام معامله"
                />
              </ul>
            </nav>
          </section>

          <button
            type="button"
            disabled={logoutMutation.isPending}
            onClick={handleLogout}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-card border border-danger/20 bg-danger/5 px-4 text-ui font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-4" aria-hidden />
            )}
            خروج از حساب
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Small building blocks ----------------------------------------------------

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-0.5">
      <h2 id={id} className="text-section font-black tracking-tight text-foreground">
        {title}
      </h2>
      <p className="text-caption text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: 'primary' | 'accent';
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[76px] min-w-0 items-center gap-3 rounded-surface border border-border bg-surface p-3 shadow-soft transition-all duration-small hover:border-primary/25 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-32 sm:flex-col sm:items-stretch sm:justify-between sm:gap-0 sm:p-4 sm:hover:-translate-y-0.5"
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-card',
          tone === 'primary' ? 'bg-primary-soft text-primary' : 'bg-accent/10 text-accent-dark',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 sm:mt-3">
        <span className="block break-words text-ui font-bold text-foreground sm:truncate">{title}</span>
        <span className="mt-0.5 block text-caption leading-5 text-muted-foreground sm:mt-1">
          {description}
        </span>
      </span>
      <span className="ms-auto shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:mt-2 sm:flex sm:justify-end">
        <ChevronLeft className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

function AccountLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-[64px] items-center gap-3 px-3 py-3 sm:min-h-[68px] sm:px-4 transition-colors duration-small hover:bg-primary-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft/70 text-primary">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-ui font-semibold text-foreground">{title}</span>
          <span className="mt-0.5 block text-caption text-muted-foreground">{description}</span>
        </span>
        <ChevronLeft className="size-4 shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

function SessionSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  );
}
