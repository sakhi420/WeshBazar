'use client';

/**
 * Sell wizard state (master prompt §34–§41, §139).
 *
 * Holds the draft (persisted to localStorage so a reload keeps the work) and
 * the in-memory pending-image queue (§35 — `File` handles cannot survive a
 * reload, so photos are re-picked when lost). All server mutations live in
 * the step pages; the provider only owns state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  SELL_DRAFT_STORAGE_KEY,
  scopedDraftStorageKey,
  createEmptyDraft,
  draftHasProgress,
  parseStoredDraft,
  serializeDraft,
  type SellDraft,
} from '@/features/listings';
import type { PendingImage } from '@/features/media';

interface SellContextValue {
  /** true once the stored draft has been read (before that, hold the UI). */
  ready: boolean;
  draft: SellDraft;
  /** A stored draft with real progress was restored this session. */
  restored: boolean;
  /** Merge draft fields and persist. */
  updateDraft: (partial: Partial<SellDraft>) => void;
  /** Merge contact configuration fields and persist. */
  updateContact: (partial: Partial<SellDraft['contact']>) => void;
  /** Replace the draft entirely (restore, server merge, fresh start). */
  replaceDraft: (next: SellDraft) => void;
  /** Hide the recovery banner without discarding the draft. */
  dismissRestored: () => void;
  /** Discard everything: storage, draft and queued photos. */
  resetDraft: () => void;
  /** Locally picked images awaiting upload (memory only). */
  pendingImages: PendingImage[];
  /** Queue already-validated files (object URLs + dimension probing). */
  addPendingImages: (files: readonly File[]) => void;
  /** Drop one queued image (revokes its object URL). */
  removePendingImage: (id: string) => void;
  /** Move one queued image a slot earlier (-1) or later (1). */
  movePendingImage: (id: string, direction: -1 | 1) => void;
  /** Forget every queued photo (after upload or discard). */
  clearPendingImages: () => void;
}

const SellContext = createContext<SellContextValue | null>(null);

function createPendingId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SellProvider({
  children,
  userId,
}: {
  children: ReactNode;
  /** Authenticated user ID; when supplied the draft is scoped to this owner. */
  userId?: string | null;
}) {
  const [draft, setDraft] = useState<SellDraft>(() => createEmptyDraft());
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // Latest queue mirror for URL revocation outside render (unmount + reset).
  const pendingRef = useRef<PendingImage[]>([]);
  useEffect(() => {
    pendingRef.current = pendingImages;
  }, [pendingImages]);

  const storageKey = userId ? scopedDraftStorageKey(userId) : SELL_DRAFT_STORAGE_KEY;

  // Hydrate once from localStorage (§139). Client-side only — the guard keeps
  // the steps dark until `ready` so no form ever mounts against an empty draft.
  useEffect(() => {
    let stored: SellDraft | null = null;
    try {
      // Try scoped key first; fall back to unscoped (legacy migration path).
      stored = parseStoredDraft(window.localStorage.getItem(storageKey));
      if (stored === null && userId) {
        // Check for an unscoped legacy draft from before owner-scoping was added.
        const legacy = parseStoredDraft(
          window.localStorage.getItem(SELL_DRAFT_STORAGE_KEY),
        );
        if (legacy !== null && draftHasProgress(legacy)) {
          // Quarantine: move the legacy draft to the scoped key so it is only
          // visible to this account and never resurfaces for another user.
          window.localStorage.setItem(storageKey, serializeDraft(legacy));
          window.localStorage.removeItem(SELL_DRAFT_STORAGE_KEY);
          stored = legacy;
        }
      }
    } catch {
      stored = null;
    }
    if (stored !== null && draftHasProgress(stored)) {
      setDraft(stored);
      setRestored(true);
    }
    setReady(true);
  }, []);

  // Revoke outstanding object URLs when the wizard unmounts.
  useEffect(
    () => () => {
      for (const item of pendingRef.current) URL.revokeObjectURL(item.url);
    },
    [],
  );

  const persist = useCallback((next: SellDraft) => {
    try {
      window.localStorage.setItem(storageKey, serializeDraft(next));
    } catch {
      // Storage can be unavailable (private mode, quota) — stay in-memory.
    }
  }, [storageKey]);

  const updateDraft = useCallback(
    (partial: Partial<SellDraft>) => {
      setDraft((current) => {
        const next = { ...current, ...partial, updatedAt: new Date().toISOString() };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateContact = useCallback(
    (partial: Partial<SellDraft['contact']>) => {
      setDraft((current) => {
        const next = {
          ...current,
          contact: { ...current.contact, ...partial },
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const replaceDraft = useCallback(
    (next: SellDraft) => {
      setDraft(next);
      persist(next);
    },
    [persist],
  );

  const dismissRestored = useCallback(() => setRestored(false), []);

  const clearPendingImages = useCallback(() => {
    for (const item of pendingRef.current) URL.revokeObjectURL(item.url);
    setPendingImages([]);
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyDraft());
    setRestored(false);
    clearPendingImages();
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Same as persist — nothing else to do.
    }
  }, [clearPendingImages, storageKey]);

  const addPendingImages = useCallback((files: readonly File[]) => {
    if (files.length === 0) return;
    const items: PendingImage[] = files.map((file) => ({
      id: createPendingId(),
      file,
      url: URL.createObjectURL(file),
      width: 0,
      height: 0,
    }));
    setPendingImages((current) => [...current, ...items]);
    // Probe intrinsic dimensions so tiles can reserve the real aspect ratio.
    for (const item of items) {
      const probe = new Image();
      probe.onload = () => {
        setPendingImages((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, width: probe.naturalWidth, height: probe.naturalHeight }
              : candidate,
          ),
        );
      };
      probe.src = item.url;
    }
  }, []);

  const removePendingImage = useCallback((id: string) => {
    const target = pendingRef.current.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setPendingImages((current) => current.filter((item) => item.id !== id));
  }, []);

  const movePendingImage = useCallback((id: string, direction: -1 | 1) => {
    setPendingImages((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (moved === undefined) return current;
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const value = useMemo<SellContextValue>(
    () => ({
      ready,
      draft,
      restored,
      updateDraft,
      updateContact,
      replaceDraft,
      dismissRestored,
      resetDraft,
      pendingImages,
      addPendingImages,
      removePendingImage,
      movePendingImage,
      clearPendingImages,
    }),
    [
      ready,
      draft,
      restored,
      updateDraft,
      updateContact,
      replaceDraft,
      dismissRestored,
      resetDraft,
      pendingImages,
      addPendingImages,
      removePendingImage,
      movePendingImage,
      clearPendingImages,
    ],
  );

  return <SellContext.Provider value={value}>{children}</SellContext.Provider>;
}

/** Access the wizard state; throws outside the provider tree. */
export function useSell(): SellContextValue {
  const context = useContext(SellContext);
  if (context === null) {
    throw new Error('useSell must be used inside <SellProvider>');
  }
  return context;
}
