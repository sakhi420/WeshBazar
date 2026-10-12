'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { queryKeys, get, ApiError, type PageResult } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/features/listings';
import { AdminAccessDenied } from './admin-access-denied';
import { useAdminGate } from '../hooks';

interface AdminUser {
  id: string;
  phone: string;
  displayName: string;
  role: string;
  status: string;
  phoneVerified: boolean;
  createdAt: string;
}

function fetchAdminUsers(params: { q?: string; page?: number }): Promise<PageResult<AdminUser>> {
  const query: Record<string, string> = {};
  if (params.q) query.q = params.q;
  if (params.page) query.page = String(params.page);
  return get<AdminUser[]>('/admin/users', { query }).then((data) => ({
    items: data as unknown as AdminUser[],
    page: params.page ?? 1,
    limit: 20,
    total: (data as unknown as AdminUser[]).length,
    totalPages: 1,
    hasMore: false,
  }));
}

const ROLE_LABELS: Record<string, string> = { USER: 'کاربر', MODERATOR: 'ناظر', ADMIN: 'مدیر' };
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'فعال', SUSPENDED: 'معلق', BANNED: 'مسدود', DEACTIVATED: 'غیرفعال' };

export function AdminUsersView() {
  const { status } = useAdminGate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.users({ q: search || undefined }),
    queryFn: () => fetchAdminUsers({ q: search || undefined }),
    enabled: status === 'ready',
  });

  if (status === 'checking') return <Loader2 className="mx-auto mt-8 size-6 animate-spin text-muted-foreground" />;
  if (status === 'anonymous' || status === 'unreachable') return <ErrorState onRetry={() => window.location.reload()} />;
  if (status === 'forbidden') return <AdminAccessDenied />;

  const users = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جست‌وجوی کاربر…"
            className="h-control w-full rounded-control border border-input bg-background pe-3 ps-9 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>
      {isLoading ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> :
       isError ? <ErrorState requestId={error instanceof ApiError ? error.requestId : undefined} onRetry={() => void refetch()} /> :
       users.length === 0 ? <EmptyState icon={Search} title="کاربری پیدا نشد" /> :
       <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-ui">
          <thead className="border-b border-border bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">نام</th>
              <th className="px-4 py-3 text-start font-medium">شماره</th>
              <th className="px-4 py-3 text-start font-medium">نقش</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
              <th className="px-4 py-3 text-start font-medium">تأیید</th>
              <th className="px-4 py-3 text-start font-medium">تاریخ عضویت</th>
            </tr>
          </thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium">{u.displayName}</td>
              <td className="px-4 py-3 font-mono text-meta" dir="ltr">{u.phone}</td>
              <td className="px-4 py-3">{ROLE_LABELS[u.role] ?? u.role}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-caption font-medium ${u.status === 'ACTIVE' ? 'bg-success/10 text-success' : u.status === 'SUSPENDED' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>{STATUS_LABELS[u.status] ?? u.status}</span></td>
              <td className="px-4 py-3">{u.phoneVerified ? '✅' : '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(u.createdAt)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>}
    </div>
  );
}