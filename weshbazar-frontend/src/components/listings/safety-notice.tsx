import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyNoticeProps {
  className?: string;
}

/** Deal-safety guidance shown on every listing (master prompt §58 block 11). */
export function SafetyNotice({ className }: SafetyNoticeProps) {
  return (
    <section
      aria-labelledby="safety-notice-title"
      className={cn('flex gap-3 rounded-card border border-border bg-primary-soft/60 p-4', className)}
    >
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="space-y-1">
        <h2 id="safety-notice-title" className="text-ui font-semibold text-foreground">
          راهنمای ایمنی معامله
        </h2>
        <ul className="list-disc space-y-1 ps-4 text-meta text-muted-foreground">
          <li>پیش از پرداخت، کالا را از نزدیک ببینید.</li>
          <li>از واریز بیعانه به افراد ناشناس خودداری کنید.</li>
          <li>وش‌بازار در انجام معامله واسطه نیست؛ بررسی کالا با خریدار است.</li>
        </ul>
      </div>
    </section>
  );
}
