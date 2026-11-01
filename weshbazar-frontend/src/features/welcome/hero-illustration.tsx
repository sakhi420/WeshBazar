import {
  Car,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandStar } from './brand-star';

/**
 * Custom, brand-consistent hero visual for the welcome landing (§3).
 *
 * Deliberately reads as a *real market feed* — search, category tiles and a
 * direct-contact strip — rather than generic stock imagery, so a first-time
 * visitor immediately understands what WeshBazar does. Uses only brand tokens,
 * lucide icons and clean geometric SVG decorations.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)} aria-hidden>
      {/* soft atmospheric blobs (no negative inline offsets → no overflow) */}
      <div className="pointer-events-none absolute -top-6 start-4 h-40 w-40 rounded-full bg-primary/10 blur-3xl animate-wb-float-slow" />
      <div className="pointer-events-none absolute bottom-6 end-4 h-44 w-44 rounded-full bg-accent/15 blur-3xl animate-wb-float" />

      {/* floating decorative stars */}
      <BrandStar className="absolute -top-4 end-2 h-8 w-8 text-accent/70 animate-wb-float" />
      <BrandStar className="absolute -bottom-3 start-8 h-6 w-6 text-primary/50 animate-wb-float-delay" />

      {/* marketplace card */}
      <div className="relative rounded-[1.75rem] border border-primary/10 bg-white/90 p-4 shadow-lift backdrop-blur-sm sm:p-5">
        {/* search pill */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Search className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2 w-3/4 rounded-full bg-muted/60" />
            <div className="h-2 w-1/2 rounded-full bg-muted/40" />
          </div>
          <span className="hidden rounded-full bg-accent/15 px-3 py-1 text-caption font-semibold text-accent-dark sm:inline">
            جست‌وجو
          </span>
        </div>

        {/* category tiles */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniTile icon={Car} label="وسایط" />
          <MiniTile icon={Home} label="ملک" highlight />
          <MiniTile icon={Smartphone} label="برقی" />
        </div>

        {/* direct-contact strip */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary-dark px-4 py-3 text-white">
          <MessageCircle className="size-5 shrink-0 text-accent" aria-hidden />
          <span className="text-ui font-medium">تماس مستقیم با فروشنده</span>
        </div>
      </div>

      {/* floating chip — new listing */}
      <div className="absolute -bottom-4 start-6 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 shadow-card animate-wb-float">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <span className="text-caption font-semibold text-foreground">آگهی نو</span>
      </div>

      {/* floating chip — location */}
      <div className="absolute -top-4 end-6 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 shadow-card animate-wb-float-delay">
        <MapPin className="size-4 text-primary" aria-hidden />
        <span className="text-caption font-semibold text-foreground">کابل</span>
      </div>
    </div>
  );
}

function MiniTile({
  icon: Icon,
  label,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-3 text-center shadow-soft',
        highlight ? 'border-accent/30 bg-accent/10' : 'border-border bg-surface',
      )}
    >
      <span
        className={cn(
          'mx-auto flex size-10 items-center justify-center rounded-xl',
          highlight ? 'bg-accent/20 text-accent-dark' : 'bg-primary-soft text-primary',
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="mx-auto mt-2 h-1.5 w-2/3 rounded-full bg-muted/60" />
      <p className="mt-1.5 text-caption font-medium text-foreground">{label}</p>
    </div>
  );
}