/**
 * DISABILITY ASSIST in Options. What a tap or click on the picture does (show the information bar, as standard,
 * or change channel: the next one in order, or a random one), and whether a long press on the picture opens
 * the Guide. Kept in this browser.
 */
import { useSyncExternalStore } from 'react'
import type { TvCommand } from '../types/input.ts'

export const ASSIST_KEY = 'wardtv.assist.v1'

export type TapAction = 'info' | 'next' | 'random'

export interface AssistSettings {
  tap: TapAction
  holdGuide: boolean
}

export const ASSIST_DEFAULTS: AssistSettings = { tap: 'info', holdGuide: true }

export const TAP_ACTIONS: readonly { id: TapAction; label: string }[] = [
  { id: 'info', label: 'Show information' },
  { id: 'next', label: 'Next channel' },
  { id: 'random', label: 'Random channel' },
]

/** A press held this long on the picture opens the Guide; moving further than the tolerance makes it a swipe. */
export const HOLD_MS = 600
export const HOLD_TOLERANCE_PX = 12

type Store = Pick<Storage, 'getItem' | 'setItem'>

function browserStore(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function loadAssist(store: Store | null = browserStore()): AssistSettings {
  try {
    const saved = JSON.parse(store?.getItem(ASSIST_KEY) ?? 'null') as Partial<AssistSettings> | null
    return {
      tap: TAP_ACTIONS.some((action) => action.id === saved?.tap) ? (saved?.tap as TapAction) : ASSIST_DEFAULTS.tap,
      holdGuide: typeof saved?.holdGuide === 'boolean' ? saved.holdGuide : ASSIST_DEFAULTS.holdGuide,
    }
  } catch {
    return { ...ASSIST_DEFAULTS }
  }
}

let current: AssistSettings | null = null
const listeners = new Set<() => void>()

export function assistSettings(): AssistSettings {
  current ??= loadAssist()
  return current
}

export function setAssist(change: Partial<AssistSettings>, store: Store | null = browserStore()): void {
  current = { ...assistSettings(), ...change }
  try {
    store?.setItem(ASSIST_KEY, JSON.stringify(current))
  } catch {
    // A browser that keeps nothing still uses the setting for this visit.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAssist(): AssistSettings {
  return useSyncExternalStore(subscribe, assistSettings, () => ASSIST_DEFAULTS)
}

/** The command a tap or click on the picture sends. */
export function tapCommand(tap: TapAction): TvCommand {
  if (tap === 'next') return { type: 'channel-up' }
  if (tap === 'random') return { type: 'random-channel' }
  return { type: 'info' }
}
