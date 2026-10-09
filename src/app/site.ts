import { EDITION } from '../edition.ts'

/**
 * WardTV keeps everything it stores in the browser under its own names (`wardtv:`), so it never reads or
 * writes TVN's channels, users, favourites or settings, even where both have been used on one origin.
 */
const SITE_PREFIX = EDITION.storagePrefix

/** The name a browser database or setting has in WardTV. */
export function siteName(name: string): string {
  return `${SITE_PREFIX}${name}`
}

/** A Storage whose keys are kept apart from any other site's on the same origin. */
export function prefixedStorage(store: Storage, prefix = SITE_PREFIX): Storage {
  const own = () => {
    const keys: string[] = []
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index)
      if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length))
    }
    return keys
  }
  return {
    get length() {
      return own().length
    },
    key: (index) => own()[index] ?? null,
    getItem: (key) => store.getItem(prefix + key),
    setItem: (key, value) => store.setItem(prefix + key, value),
    removeItem: (key) => store.removeItem(prefix + key),
    clear: () => {
      for (const key of own()) store.removeItem(prefix + key)
    },
  }
}

/** Run before anything reads storage: localStorage answers with WardTV's own keys only. */
export function installSiteStorage(): void {
  if (typeof window === 'undefined') return
  let store: Storage
  try {
    store = window.localStorage
  } catch {
    return
  }
  const own = prefixedStorage(store)
  Object.defineProperty(window, 'localStorage', { configurable: true, get: () => own })
}
