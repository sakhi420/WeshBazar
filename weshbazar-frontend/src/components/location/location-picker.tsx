'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/api';
import { fetchProvinces, fetchCities } from '@/features/locations';
import type { Province, City } from '@/features/locations';

interface LocationPickerProps { className?: string; }

export function LocationPicker({ className }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [provinceParam, setProvinceParam] = useQueryState('province');
  const [cityParam, setCityParam] = useQueryState('city');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: provinces = [] } = useQuery({
    queryKey: queryKeys.locations.provinces,
    queryFn: () => fetchProvinces(),
    staleTime: 60 * 60_000,
  });

  const selectedProvince = provinces.find((p) => p.slug === provinceParam) ?? null;

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.locations.cities(selectedProvince?.id ?? ''),
    queryFn: () => fetchCities(selectedProvince!.id),
    enabled: !!selectedProvince,
    staleTime: 60 * 60_000,
  });

  const selectedCity = cities.find((c) => c.slug === cityParam) ?? null;

  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) { document.addEventListener('mousedown', handleOutside); return () => document.removeEventListener('mousedown', handleOutside); }
  }, [open, handleOutside]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    if (open) { document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }
  }, [open]);

  const label = selectedCity ? selectedCity.name : selectedProvince ? `${selectedProvince.name} (همه)` : 'انتخاب شهر';

  function selectProvince(p: Province) { setProvinceParam(p.slug); if (p.slug !== provinceParam) setCityParam(null); }
  function selectCity(c: City | null) { setCityParam(c?.slug ?? null); setOpen(false); }
return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button type="button" onClick={() => setOpen((p) => !p)} aria-expanded={open} aria-label={`موقعیت: ${label}`}
        className={cn('inline-flex h-control items-center gap-2 rounded-card border bg-surface px-3 text-ui font-medium transition-colors duration-small',
          'hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          open ? 'border-primary text-primary' : 'border-border text-foreground')}>
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="truncate max-w-32">{label}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div className="absolute start-0 top-full z-drawer mt-1 min-w-56 overflow-hidden rounded-surface border border-border bg-surface shadow-lg">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] divide-x divide-border">
            <ul className="max-h-64 overflow-y-auto py-1">
              {provinces.map((p) => (
                <li key={p.id}><button type="button" role="option" aria-selected={p.slug === provinceParam} onClick={() => selectProvince(p)}
                  className={cn('w-full px-4 py-2.5 text-start text-ui', p.slug === provinceParam ? 'bg-primary-soft text-primary font-medium' : 'text-foreground hover:bg-primary-soft/50')}>{p.name}</button></li>
              ))}
            </ul>
            <ul className="max-h-64 overflow-y-auto py-1">
              <li><button type="button" role="option" aria-selected={!cityParam} onClick={() => selectCity(null)}
                className={cn('w-full px-4 py-2.5 text-start text-ui', !cityParam ? 'bg-primary-soft text-primary font-medium' : 'text-foreground hover:bg-primary-soft/50')}>همه شهرها</button></li>
              {selectedProvince ? cities.map((c) => (
                <li key={c.id}><button type="button" role="option" aria-selected={c.slug === cityParam} onClick={() => selectCity(c)}
                  className={cn('w-full px-4 py-2.5 text-start text-ui', c.slug === cityParam ? 'bg-primary-soft text-primary font-medium' : 'text-foreground hover:bg-primary-soft/50')}>{c.name}</button></li>
              )) : provinces.length > 0 ? <li className="px-4 py-6 text-center text-caption text-muted-foreground">یک ولایت انتخاب کنید</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}