'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, queryKeys } from '@/lib/api';
import { updateMyProfile, uploadAvatar } from '../api';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
/** Client-side cap mirroring the backend storage.maxUploadSize (5 MiB). */
const MAX_BYTES = 5 * 1024 * 1024;

function avatarErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.';
    }
    switch (error.code) {
      case 'UNSUPPORTED_IMAGE_TYPE':
        return 'فرمت عکس پشتیبانی نمی‌شود؛ JPEG، PNG یا WebP بفرستید.';
      case 'IMAGE_TOO_LARGE':
        return 'حجم عکس بیش از حد مجاز است (بیشتر از ۵ مگابایت).';
      case 'IMAGE_DIMENSIONS_TOO_LARGE':
        return 'ابعاد عکس بیش از حد مجاز است.';
      default:
        break;
    }
  }
  return 'آپلود عکس ناموفق بود. دوباره تلاش کنید.';
}

/**
 * Change/remove the server-side profile photo via `POST /me/avatar` and
 * `PATCH /me { avatarKey: '' }`. The fresh profile response is written back
 * into the shared query cache so the account card re-renders immediately.
 */
export function ProfilePhotoControls({ hasAvatar }: { hasAvatar: boolean }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('فقط عکس JPEG، PNG یا WebP مجاز است.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('حجم عکس نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }
    setBusy(true);
    try {
      const profile = await uploadAvatar(file);
      queryClient.setQueryData(queryKeys.account.profile, profile);
    } catch (err) {
      setError(avatarErrorText(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      const profile = await updateMyProfile({ avatarKey: '' });
      queryClient.setQueryData(queryKeys.account.profile, profile);
    } catch (err) {
      setError(avatarErrorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 aria-hidden className="animate-spin" /> : <ImagePlus aria-hidden />}
          تغییر عکس
        </Button>
        {hasAvatar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            className="text-danger hover:bg-danger/5 hover:text-danger"
            onClick={handleRemove}
          >
            <Trash2 aria-hidden />
            حذف عکس
          </Button>
        ) : null}
      </div>
      <p className="mt-1 text-caption text-muted-foreground">
        JPEG، PNG یا WebP · حداکثر ۵ مگابایت
      </p>
      {error ? (
        <p role="alert" className="mt-1 text-meta text-danger">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        aria-label="انتخاب عکس پروفایل"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}