/**
 * WardTV: the hospital television edition of TVN. A curated network only: Channel 000, the central
 * channels 001–999 and Local Media at 1000. There is no User Network, so nothing at 1001 and above,
 * and nothing that adds, imports, exports, edits or switches channels.
 */
export const EDITION = {
  name: 'WardTV',
  title: 'WARDTV',
  tagline: 'Television for everyone.',
  poweredBy: 'Powered by TVN',
  version: '1.0.0',
  domain: 'wardtv.uk',
  /** Everything WardTV keeps in a browser is under this prefix, never under TVN's names. */
  storagePrefix: 'wardtv:',
  userNetwork: false,
} as const

/** The highest channel number WardTV has; 1001+ (the User Network) does not exist here. */
export const LAST_CHANNEL_NUMBER = 1000

/** Channels a first look-in may start on: any central channel, never Channel 000. */
export const FIRST_CENTRAL_CHANNEL = 1
export const LAST_CENTRAL_CHANNEL = 999
