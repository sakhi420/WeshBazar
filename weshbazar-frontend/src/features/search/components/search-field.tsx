'use client';

/**
 * Keyword field for the discovery surfaces (master prompt §21, §105, §112–113).
 * Submitting writes `q` to the URL (push) so results are shareable and the
 * back button steps through queries. While focused, an accessible combobox
 * offers recent searches (empty input) or a debounced live preview of matching
 * listings (typed input). Suggestions are additive — Enter still commits.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, Loader2, Search, X } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { discoveryParamsParsers } from '@/features/search/parsers';
import {
  readRecentSearches,
  saveRecentSearch,
  useSearchSuggestions,
  type SearchSuggestion,
} from '@/features/search/use-search-suggestions';
import { recordSearchEvent } from '../telemetry';

interface SearchFieldProps {
  className?: string;
  placeholder?: string;
  /** When true, submits navigate to /search?q=... instead of writing q to current URL. */
  redirectToSearch?: boolean;
}

export function SearchField({
  className,
  placeholder = 'جست‌وجو در ویش‌بازار…',
  redirectToSearch = false,
}: SearchFieldProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reactId = useId();
  const listboxId = `search-suggestions-${reactId}`;
  const [query, setQuery] = useQueryState(
    'q',
    discoveryParamsParsers.q.withOptions({ history: 'push', shallow: false }),
  );
  const [value, setValue] = useState(query ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches());
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep the field in sync when the URL changes (chips cleared, back button).
  useEffect(() => {
    setValue(query ?? '');
  }, [query]);

  const trimmed = value.trim();

  // Reset the highlighted option whenever the query text changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmed]);

  const { listings, loading } = useSearchSuggestions(trimmed, open && trimmed.length >= 2);

  const suggestions: SearchSuggestion[] =
    trimmed.length === 0
      ? recent.map((text) => ({ kind: 'recent' as const, label: text, query: text }))
      : listings;

  // Close on outside pointer interaction.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function commit(nextRaw: string) {
    const next = nextRaw.trim();

    // Header variant: open a fresh keyword search instead of writing `q` onto
    // the current page (`account`, `admin`, `sell`, …). On /search we stay put
    // and only change `q` so the other URL filters are preserved.
    if (redirectToSearch) {
      if (pathname === '/search') {
        void setQuery(next ? next : null);
      } else {
        router.push(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
      }
    } else {
      void setQuery(next ? next : null);
    }

    if (next) {
      saveRecentSearch(next);
      void recordSearchEvent({ type: 'search_submitted', q: next });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit(value);
  }

  function handleClear() {
    setValue('');
    setOpen(false);
    setActiveIndex(-1);
    void setQuery(null);
  }

  function handleFocus() {
    setRecent(readRecentSearches());
    setOpen(true);
    setActiveIndex(-1);
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    setOpen(false);
    setActiveIndex(-1);
    if (suggestion.kind === 'listing' && suggestion.slug) {
      router.push(`/listing/${encodeURIComponent(suggestion.slug)}`);
      return;
    }
    const next = suggestion.query ?? suggestion.label;
    setValue(next);
    commit(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion) selectSuggestion(suggestion);
    }
  }

  let dropdown: ReactNode = null;
  if (open) {
    if (trimmed.length === 0 && recent.length > 0) {
      dropdown = (
        <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto p-1">
          {suggestions.map((suggestion, index) => (
            <SuggestionOption
              key={`recent-${suggestion.query ?? index}`}
              id={`${listboxId}-option-${index}`}
              suggestion={suggestion}
              active={index === activeIndex}
              onHover={() => setActiveIndex(index)}
              onSelect={selectSuggestion}
            />
          ))}
        </ul>
      );
    } else if (trimmed.length >= 2) {
      if (loading) {
        dropdown = (
          <p id={listboxId} className="flex items-center gap-2 px-3 py-2.5 text-ui text-muted-foreground">
            <Loader2 aria-hidden className="size-4 animate-spin text-primary" />
            در حال جست‌وجو…
          </p>
        );
      } else if (suggestions.length > 0) {
        dropdown = (
          <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto p-1">
            {suggestions.map((suggestion, index) => (
              <SuggestionOption
                key={`listing-${suggestion.slug ?? index}`}
                id={`${listboxId}-option-${index}`}
                suggestion={suggestion}
                active={index === activeIndex}
                onHover={() => setActiveIndex(index)}
                onSelect={selectSuggestion}
              />
            ))}
          </ul>
        );
      } else {
        dropdown = (
          <p className="px-3 py-2 text-ui text-muted-foreground">
            نتیجه‌ای یافت نشد — Enter را برای جست‌وجوی کامل بزنید.
          </p>
        );
      }
    }
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('flex items-center gap-2', className)}>
      <div ref={wrapperRef} className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 && suggestions[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
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
        {dropdown ? (
          <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-control border border-border bg-background shadow-card">
            {dropdown}
          </div>
        ) : null}
      </div>
      <Button type="submit" size="lg" className="shrink-0">
        جست‌وجو
      </Button>
    </form>
  );
}

interface SuggestionOptionProps {
  id: string;
  suggestion: SearchSuggestion;
  active: boolean;
  onHover: () => void;
  onSelect: (suggestion: SearchSuggestion) => void;
}

function SuggestionOption({ id, suggestion, active, onHover, onSelect }: SuggestionOptionProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(event) => {
        // Keep focus in the input so the click still selects.
        event.preventDefault();
        onSelect(suggestion);
      }}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-body',
        active ? 'bg-muted text-foreground' : 'text-foreground',
      )}
    >
      {suggestion.kind === 'recent' ? (
        <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className="truncate" dir="auto">
        {suggestion.label}
      </span>
    </li>
  );
}
