'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/api';
import { fetchProvinces, fetchCities } from '@/features/locations';
import type { Province, City } from '@/features/locations';

interface LocationPickerProps {
  className?: string;
  /** When true, selecting a location navigates to `/search` instead of writing params onto the current URL. */
  redirectToSearch?: boolean;
  /** Hug the trigger content instead of stretching to the parent width. */
  inline?: boolean;
}

interface PanelCoords {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

function panelCoordsFromTrigger(trigger: HTMLElement): PanelCoords {
  const rect = trigger.getBoundingClientRect();
  const gutter = 8;
  const minWidth = 280;
  const width = Math.min(Math.max(rect.width, minWidth), window.innerWidth - gutter * 2);
  const left = Math.min(
    Math.max(gutter, rect.right - width),
    window.innerWidth - width - gutter,
  );
  const spaceBelow = window.innerHeight - rect.bottom - gutter;
  const spaceAbove = rect.top - gutter;
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(160, openUp ? spaceAbove : spaceBelow);
  const top = openUp ? Math.max(gutter, rect.top - maxHeight - 4) : rect.bottom + 4;
  return { top, left, width, maxHeight };
}

export function LocationPicker({
  className,
  redirectToSearch = false,
  inline = false,
}: LocationPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [provinceParam, setProvinceParam] = useQueryState('province');
  const [cityParam, setCityParam] = useQueryState('city');
  const [pickedProvince, setPickedProvince] = useState<Province | null>(null);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    data: provinces = [],
    isError: provincesFailed,
    refetch: refetchProvinces,
  } = useQuery({
    queryKey: queryKeys.locations.provinces,
    queryFn: () => fetchProvinces(),
    staleTime: 60 * 60_000,
  });

  const urlProvince = provinces.find((p) => p.slug === provinceParam) ?? null;
  const activeProvince = redirectToSearch ? pickedProvince : urlProvince;

  const {
    data: cities = [],
    isError: citiesFailed,
    refetch: refetchCities,
  } = useQuery({
    queryKey: queryKeys.locations.cities(activeProvince?.id ?? 'none'),
    queryFn: () => (activeProvince ? fetchCities(activeProvince.id) : Promise.resolve([])),
    enabled: !!activeProvince,
    staleTime: 60 * 60_000,
  });

  const selectedCity = cities.find((c) => c.slug === cityParam) ?? null;

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    setCoords(panelCoordsFromTrigger(triggerRef.current));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function onReposition() {
      updateCoords();
    }
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = selectedCity
    ? selectedCity.name
    : activeProvince
      ? `${activeProvince.name} (همه)`
      : 'انتخاب شهر';

  function buildSearchHref(province?: string, city?: string): string {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    if (city) params.set('city', city);
    const qs = params.toString();
    return qs ? `/search?${qs}` : '/search';
  }

  function selectProvince(p: Province) {
    if (redirectToSearch) {
      setPickedProvince(p);
      setOpen(true);
      return;
    }
    setProvinceParam(p.slug);
    if (p.slug !== provinceParam) setCityParam(null);
  }

  function selectCity(c: City | null) {
    if (redirectToSearch) {
      void router.push(buildSearchHref(pickedProvince?.slug, c?.slug ?? undefined));
      setOpen(false);
      return;
    }
    setCityParam(c?.slug ?? null);
    setOpen(false);
  }

  const allCitiesSelected = redirectToSearch ? !pickedProvince || !cityParam : !cityParam;

  const panel =
    open && coords ? (
      <div
        ref={panelRef}
        role="listbox"
        aria-label="انتخاب ولایت و شهر"
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
          maxHeight: coords.maxHeight,
        }}
        className="fixed z-modal overflow-hidden rounded-surface border border-border bg-surface text-foreground shadow-lg"
      >
        <div className="grid h-full max-h-[inherit] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] divide-x divide-x-reverse divide-border">
          <ul className="max-h-[inherit] overflow-y-auto py-1">
            {provincesFailed ? (
              <li className="px-4 py-6 text-center text-caption text-muted-foreground">
                بارگذاری ولایت‌ها ناموفق بود
                <button
                  type="button"
                  onClick={() => void refetchProvinces()}
                  className="mt-2 block text-primary underline"
                >
                  تلاش دوباره
                </button>
              </li>
            ) : (
              provinces.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={p.slug === activeProvince?.slug}
                    onClick={() => selectProvince(p)}
                    className={cn(
                      'w-full px-4 py-2.5 text-start text-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      p.slug === activeProvince?.slug
                        ? 'bg-primary-soft font-medium text-primary'
                        : 'text-foreground hover:bg-primary-soft/50',
                    )}
                  >
                    <span className="block truncate">{p.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <ul className="max-h-[inherit] overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={allCitiesSelected}
                onClick={() => selectCity(null)}
                className={cn(
                  'w-full px-4 py-2.5 text-start text-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  allCitiesSelected
                    ? 'bg-primary-soft font-medium text-primary'
                    : 'text-foreground hover:bg-primary-soft/50',
                )}
              >
                همه شهرها
              </button>
            </li>
            {activeProvince ? (
              citiesFailed ? (
                <li className="px-4 py-6 text-center text-caption text-muted-foreground">
                  بارگذاری شهرها ناموفق بود
                  <button
                    type="button"
                    onClick={() => void refetchCities()}
                    className="mt-2 block text-primary underline"
                  >
                    تلاش دوباره
                  </button>
                </li>
              ) : (
                cities.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.slug === cityParam}
                      onClick={() => selectCity(c)}
                      className={cn(
                        'w-full px-4 py-2.5 text-start text-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        c.slug === cityParam
                          ? 'bg-primary-soft font-medium text-primary'
                          : 'text-foreground hover:bg-primary-soft/50',
                      )}
                    >
                      <span className="block truncate">{c.name}</span>
                    </button>
                  </li>
                ))
              )
            ) : provinces.length > 0 ? (
              <li className="px-4 py-6 text-center text-caption text-muted-foreground">
                یک ولایت انتخاب کنید
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className={cn('relative', inline ? 'w-auto shrink-0' : 'w-full lg:w-auto', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`موقعیت: ${label}`}
        className={cn(
          'inline-flex h-control-lg items-center gap-2 rounded-card border bg-surface px-3 text-ui font-medium text-foreground transition-colors duration-small',
          inline ? 'w-auto max-w-[11rem]' : 'w-full lg:w-auto',
          'hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open ? 'border-primary text-primary' : 'border-border',
        )}
      >
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && coords && typeof document !== 'undefined' ? createPortal(panel, document.body) : null}
    </div>
  );
}
