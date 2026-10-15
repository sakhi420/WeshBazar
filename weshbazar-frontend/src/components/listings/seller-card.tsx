import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatMonthYear } from '@/features/listings';
import type { PublicSellerRef } from '@/features/listings';

interface SellerCardProps {
  seller: PublicSellerRef;
  className?: string;
}

/**
 * Seller context block (master prompt §58 block 8) linking to the public
 * profile. Only contract-backed facts are shown — no rating or listing counts
 * that the seller ref does not carry.
 */
export function SellerCard({ seller, className }: SellerCardProps) {
  const memberSinceLabel = formatMonthYear(seller.memberSince);

  return (
    <section
      aria-labelledby="seller-card-title"
      className={cn('rounded-card border border-border bg-surface p-4', className)}
    >
      <h2 id="seller-card-title" className="text-card-title font-semibold text-foreground">
        فروشنده
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={seller.displayName} src={seller.avatarUrl ?? null} size="md" />
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-ui font-semibold text-foreground">{seller.displayName}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
            {memberSinceLabel ? <span>عضو از {memberSinceLabel}</span> : null}
            {seller.phoneVerified ? (
              <span className="inline-flex items-center gap-1 text-success">
                <BadgeCheck className="size-3.5" aria-hidden />
                شماره تأییدشده
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="mt-3 w-full">
        <Link href={`/seller/${seller.slug}`}>مشاهدهٔ پروفایل فروشنده</Link>
      </Button>
    </section>
  );
}
