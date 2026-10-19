'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
}

export function LocationPicker({ className, redirectToSearch = false }: LocationPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [provinceParam, setProvinceParam] = useQueryState('province');
  const [cityParam, setCityParam] = useQueryState('city');
  // In redirect mode the current URL never carries location params (we navigate
  // away on selection), so track the chosen province locally to drive the city column.
  const [pickedProvince, setPickedProvince] = useState<Province | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: provinces = [] } = useQuery({
    queryKey: queryKeys.locations.provinces,
    queryFn: () => fetchProvinces(),
    staleTime: 60 * 60_000,
  });

  const urlProvince = provinces.find((p) => p.slug === provinceParam) ?? null;
  const activeProvince = redirectToSearch ? pickedProvince : urlProvince;

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.locations.cities(activeProvince?.id ?? ''),
    queryFn: () => fetchCities(activeProvince!.id),
    enabled: !!activeProvince,
    staleTime: 60 * 60_000,
  });

  const selectedCity = cities.find((c) => c.slug === cityParam) ?? null;

  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [open, handleOutside]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
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
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-label={`موقعیت: ${label}`}
        className={cn(
          'inline-flex h-control-lg w-full items-center gap-2 rounded-card border bg-surface px-3 text-ui font-medium transition-colors duration-small md:w-auto',
          'hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open ? 'border-primary text-primary' : 'border-border text-foreground',
        )}
      >
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="max-w-32 truncate">{label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-drawer mt-1 min-w-56 overflow-hidden rounded-surface border border-border bg-surface shadow-lg">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] divide-x divide-border">
            <ul className="max-h-64 overflow-y-auto py-1">
              {provinces.map((p) => (
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
              ))}
            </ul>
            <ul className="max-h-64 overflow-y-auto py-1">
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!cityParam}
                  onClick={() => selectCity(null)}
                  className={cn(
                    'w-full px-4 py-2.5 text-start text-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !cityParam
                      ? 'bg-primary-soft font-medium text-primary'
                      : 'text-foreground hover:bg-primary-soft/50',
                  )}
                >
                  همه شهرها
                </button>
              </li>
              {activeProvince ? (
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
              ) : provinces.length > 0 ? (
                <li className="px-4 py-6 text-center text-caption text-muted-foreground">
                  یک ولایت انتخاب کنید
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
