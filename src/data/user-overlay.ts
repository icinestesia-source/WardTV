import type { Channel } from '../types/channel.ts'
import type { Programme } from '../types/programme.ts'
import { EDITION } from '../edition.ts'

let userChannels: readonly Channel[] = []
let userProgrammes = new Map<string, readonly Programme[]>()
let userSubChannels = new Map<string, readonly Channel[]>()
const listeners = new Set<() => void>()

/**
 * Replace the imported channel layer. Default channels are never stored here. A channel's sub-channels (one
 * per source) are kept by its id; their programmes are found by their own ids, like any channel's.
 */
export function installUserCatalogue(
  channels: readonly Channel[],
  programmes: ReadonlyMap<string, readonly Programme[]>,
  subChannels: ReadonlyMap<string, readonly { channel: Channel; programmes: readonly Programme[] }[]> = new Map(),
): void {
  // WardTV has no User Network: whatever is offered, no channel is ever installed at 1001 or above.
  const allowed = EDITION.userNetwork
  userChannels = allowed ? channels : []
  userProgrammes = allowed ? new Map(programmes) : new Map()
  userSubChannels = new Map()
  for (const [id, subs] of allowed ? subChannels : new Map<string, readonly { channel: Channel; programmes: readonly Programme[] }[]>()) {
    userSubChannels.set(id, subs.map((sub) => sub.channel))
    for (const sub of subs) userProgrammes.set(sub.channel.id, sub.programmes)
  }
  for (const listener of listeners) listener()
}

/** A user channel's sub-channels, one per source, when it has two or more; else none. */
export function subChannelsOf(channelId: string): readonly Channel[] {
  return userSubChannels.get(channelId) ?? []
}

let curatedChannels: readonly Channel[] = []
let curatedProgrammes = new Map<string, readonly Programme[]>()

/** Replace the viewer's changes to curated channels, laid over the shipped ones in this browser only. */
export function installCuratedEdits(
  channels: readonly Channel[],
  programmes: ReadonlyMap<string, readonly Programme[]>,
): void {
  curatedChannels = channels
  curatedProgrammes = new Map(programmes)
  for (const listener of listeners) listener()
}

export function curatedEditList(): readonly Channel[] {
  return curatedChannels
}

export function curatedProgrammesFor(channelId: string): readonly Programme[] | undefined {
  return curatedProgrammes.get(channelId)
}

export function subscribeCatalogue(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function userChannelList(): readonly Channel[] {
  return userChannels
}

export function userProgrammesFor(channelId: string): readonly Programme[] | undefined {
  return userProgrammes.get(channelId)
}

/**
 * The network this browser starts from. Absent (or 'tvn'): the example network TVN ships, 001–999 and the starter
 * User Network. 'new': the viewer chose NEW and cleared it, so the shipped channels are no longer part of their
 * network at all and nothing seeds them again; 000 TVN, 1000 Local Media and their own channels remain.
 */
export const NETWORK_BASE_KEY = 'tvn.network-base.v1'

export type NetworkBase = 'tvn' | 'new'

type Store = Pick<Storage, 'getItem' | 'setItem'>

function browserStore(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readNetworkBase(store: Store | null = browserStore()): NetworkBase {
  // WardTV's network is always the shipped central network.
  if (!EDITION.userNetwork) return 'tvn'
  try {
    return store?.getItem(NETWORK_BASE_KEY) === 'new' ? 'new' : 'tvn'
  } catch {
    return 'tvn'
  }
}

let networkBase: NetworkBase = readNetworkBase()

export function currentNetworkBase(): NetworkBase {
  return networkBase
}

/** Set (and keep) the network this browser starts from. Only NEW, or a restore of a file that carries it, calls this. */
export function setNetworkBase(base: NetworkBase, store: Store | null = browserStore()): void {
  try {
    store?.setItem(NETWORK_BASE_KEY, base)
  } catch {
    // Private browsing may refuse storage; the choice still holds for this visit.
  }
  networkBase = EDITION.userNetwork ? base : 'tvn'
  for (const listener of listeners) listener()
}
