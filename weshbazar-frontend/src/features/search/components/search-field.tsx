'use client';

/**
 * Keyword field for the discovery surfaces (master prompt §21, §105).
 * Submitting writes `q` to the URL (push) so results are shareable and the
 * back button steps through queries. Local state mirrors the URL while typing.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { discoveryParamsParsers } from '@/features/search/parsers';

interface SearchFieldProps {
  className?: string;
  placeholder?: string;
}

export function SearchField({
  className,
  placeholder = 'جست‌وجو در وش‌بازار…',
}: SearchFieldProps) {
  const [query, setQuery] = useQueryState(
    'q',
    discoveryParamsParsers.q.withOptions({ history: 'push' }),
  );
  const [value, setValue] = useState(query ?? '');

  // Keep the field in sync when the URL changes (chips cleared, back button).
  useEffect(() => {
    setValue(query ?? '');
  }, [query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void setQuery(value.trim() ? value.trim() : null);
  }

  function handleClear() {
    setValue('');
    void setQuery(null);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('flex items-center gap-2', className)}>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label="جست‌وجوی آگهی‌ها"
          className="h-control-lg w-full rounded-control border border-input bg-background ps-10 pe-12 text-body text-foreground outline-none transition-colors duration-small placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="پاک کردن جست‌وجو"
            className="absolute end-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors duration-small hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <Button type="submit" size="lg" className="shrink-0">
        جست‌وجو
      </Button>
    </form>
  );
}
