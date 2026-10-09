import { channelByNumber, listChannels } from '../data/catalogue.ts'
import { isLocalMediaNumber } from '../session/session-channel.ts'
import type { TvCommand } from '../types/input.ts'
import { TVN_CHANNEL_NUMBER } from '../tvn/tvn-channel.ts'
import { randomCentralChannel, type StartupRestore } from './startup-channel.ts'

export type StartupPhase = 'loading' | 'ready' | 'failed'

/**
 * Failure detection only: readiness is reached when loading finishes and never waits on this. A start
 * still loading after a minute has stalled (an unanswered request or a storage call that never returns).
 */
export const STARTUP_STALL_MS = 60_000

/** Until the network and the first channel are settled, nothing may act on the half-built tuning state. */
export function startupAccepts(phase: StartupPhase, command: TvCommand): boolean {
  return phase === 'ready' || command.type === 'fullscreen'
}

/** The 000–999 network can air once the shipped independent catalogue is in the library, fresh or restored. */
export function independentNetworkLoaded(items: readonly { ingestedFrom?: string }[]): boolean {
  return items.some((item) => item.ingestedFrom === 'youtube-discovery')
}

export interface StartupTuning {
  channelNumber: number
  previousNumber: number | null
}

/**
 * The first tuned channel and the previous-channel memory, resolved once against the loaded network.
 * WardTV starts every visit on a random central channel 001–999 that is on air (never 000 or Local Media);
 * the /tvn entry still starts on 000. The channel watched last visit becomes the previous channel, so the
 * start itself never becomes a history entry.
 */
export function resolveStartupTuning(
  restore: StartupRestore,
  stored: { lastChannelNumber: number; previousChannelNumber: number | null },
  entry: 'television' | 'tvn' = 'television',
  random: () => number = Math.random,
): StartupTuning | null {
  const channels = listChannels()
  const pick = entry === 'tvn' ? channelByNumber(TVN_CHANNEL_NUMBER) : randomCentralChannel(channels, random)
  const start = restore.target(pick, channels)
  if (!start) return null
  const previous = stored.lastChannelNumber
  return {
    channelNumber: start.number,
    previousNumber: previous !== start.number && !isLocalMediaNumber(previous) && channelByNumber(previous) ? previous : null,
  }
}

/** One line naming what stopped the start, for the console: the viewer only ever sees the off-air card. */
export function startupReason(error: unknown): string {
  if (error instanceof Error || (typeof DOMException !== 'undefined' && error instanceof DOMException)) {
    const { name, message } = error as Error
    return `${name}: ${message}`.slice(0, 300)
  }
  return String(error).slice(0, 300)
}

/**
 * Runs the startup load. `load` resolves true when the network is usable; false or a rejection is a
 * failure. The phase leaves 'loading' only when the load settles, or when it stalls past `stallMs`;
 * a stalled start that later completes still becomes ready.
 */
export function runStartup(
  load: () => Promise<boolean>,
  onPhase: (phase: Exclude<StartupPhase, 'loading'>) => void,
  stallMs = STARTUP_STALL_MS,
  report: (reason: string) => void = () => undefined,
): () => void {
  let settled = false
  let cancelled = false
  const stall = setTimeout(() => {
    if (settled || cancelled) return
    report(`still loading after ${Math.round(stallMs / 1000)} s`)
    onPhase('failed')
  }, stallMs)
  const settle = (phase: Exclude<StartupPhase, 'loading'>) => {
    if (cancelled || settled) return
    settled = true
    clearTimeout(stall)
    onPhase(phase)
  }
  load().then(
    (usable) => {
      if (!usable && !cancelled && !settled) report('the shipped network did not load')
      settle(usable ? 'ready' : 'failed')
    },
    (error: unknown) => {
      if (!cancelled && !settled) report(startupReason(error))
      settle('failed')
    },
  )
  return () => {
    cancelled = true
    clearTimeout(stall)
  }
}
