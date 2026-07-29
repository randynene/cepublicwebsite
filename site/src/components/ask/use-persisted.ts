'use client'

import { useSyncExternalStore } from 'react'

// Small localStorage-backed store for the visitor's `/ask` preferences (split
// position, dismissed proof panel).
//
// Deliberately an external store read through useSyncExternalStore rather than
// state copied in an effect. That gives the right server snapshot for hydration,
// one render instead of two, and no setState-in-effect cascade - which the
// project's lint config rejects anyway.

export interface PersistedStore<T> {
  /** Subscribe to the value. Returns `fallback` during SSR and first paint. */
  use: () => T
  set: (value: T) => void
}

export function createPersistedStore<T>({
  key,
  fallback,
  decode,
  encode,
}: {
  key: string
  fallback: T
  /** Turn the stored string into a value. Return `null` to fall back. */
  decode: (raw: string) => T | null
  encode: (value: T) => string
}): PersistedStore<T> {
  const listeners = new Set<() => void>()
  let cached: T | null = null

  function read(): T {
    if (cached !== null) return cached
    try {
      const raw = window.localStorage.getItem(key)
      cached = raw === null ? fallback : decode(raw) ?? fallback
    } catch {
      // Private-browsing modes throw on access. A forgotten preference is not
      // worth breaking the page over.
      cached = fallback
    }
    return cached
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function serverSnapshot(): T {
    return fallback
  }

  return {
    use: () => useSyncExternalStore(subscribe, read, serverSnapshot),
    set: (value: T) => {
      cached = value
      try {
        window.localStorage.setItem(key, encode(value))
      } catch {
        // Keep the in-memory value, drop the persistence.
      }
      for (const listener of listeners) listener()
    },
  }
}
