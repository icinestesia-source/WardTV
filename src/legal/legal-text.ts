import { LOCAL_SESSION_NOTE } from '../credits/provenance.ts'
import { BUILD_INFO } from '../build-info.ts'
import { EDITION } from '../edition.ts'

export const TVN_VERSION = `${EDITION.name} ${EDITION.version}`
export const LEGAL_DATE = '8 October 2026'

/**
 * The rights and attribution contact, for creators, rights holders and source representatives. Shown only
 * inside Rights & attribution, once the viewer opens Contact; never as a general contact address.
 */
export const CONTACT_EMAIL: string | null = 'tvnlol@pm.me'

export const CONTACT_HEADING = 'Rights & attribution contact'
export const CONTACT_INTRO =
  'If you are a creator, rights holder or source representative and believe WardTV contains incorrect attribution, an incorrect source link, or programming that requires our attention, you can contact us here.'
export const CONTACT_INCLUDE = 'Please identify the WardTV channel, programme/source and the nature of your request.'

export const YOUTUBE_TERMS = 'https://www.youtube.com/t/terms'
export const GOOGLE_PRIVACY = 'https://policies.google.com/privacy'
export const YOUTUBE_COPYRIGHT = 'https://support.google.com/youtube/answer/2807622'

export type LegalPart = string | { text: string; href: string }

export interface LegalSection {
  id: string
  title: string
  paragraphs: LegalPart[][]
}

/** A prefilled message for the contact route; the viewer's mail program sends it, not WardTV. */
export function contactLink(subject: string, body = ''): string | null {
  if (!CONTACT_EMAIL) return null
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`
}

/** What creators, rights holders and viewers can raise; one route, no ticket system. */
export const FEEDBACK_TOPICS = [
  'Attribution correction',
  'Incorrect creator information',
  'Broken source link',
  'Source concern',
  'Playback concern',
  'Rights-holder contact',
] as const

export const CORRECTION_TEMPLATE = [
  `Type of request (${FEEDBACK_TOPICS.join(' / ')}):`,
  'Programme or source link:',
  'WardTV channel number:',
  'What should change:',
  'Your relationship to the work (creator, rights holder, representative, viewer):',
].join('\n')

export const LEGAL_SECTIONS: readonly LegalSection[] = [
  {
    id: 'about',
    title: 'About WardTV',
    paragraphs: [
      [`WardTV is free television for everyone: ${EDITION.tagline.toLowerCase().replace(/\.$/, '')}. It arranges entertainment programmes from supported public sources into channels with a schedule, a Guide and a remote. There is nothing to sign up for and nothing to install.`],
      ['WardTV shows the curated channels 001–999, Channel 000 (the channel surfer) and, on Channel 1000, media you choose from your own device. Channels cannot be added, imported or edited.'],
      [`${EDITION.poweredBy}: WardTV is an edition of the TVN television interface.`],
    ],
  },
  {
    id: 'programming',
    title: 'Third-party programming',
    paragraphs: [
      ['Third-party programmes are hosted and delivered by their providers: YouTube programmes from YouTube, streams from their own hosts. WardTV does not host or download them, and claims no ownership of them. Each remains attributable to its creator and provider.'],
      ['Being publicly available does not make a programme public domain, and WardTV does not suggest otherwise. A licence is shown only where one has been recorded.'],
    ],
  },
  {
    id: 'youtube',
    title: 'YouTube',
    paragraphs: [
      ['YouTube-hosted programmes play through YouTube’s own embedded player. By watching them on WardTV you agree to the ', { text: 'YouTube Terms of Service', href: YOUTUBE_TERMS }, '. In Multi View only the tile you are listening to runs a YouTube player; the other YouTube tiles show a still image until you move to them.'],
      ['YouTube and Google handle information about that playback under the ', { text: 'Google Privacy Policy', href: GOOGLE_PRIVACY }, '. YouTube may set its own cookies when its player loads. YouTube does not operate, sponsor or endorse WardTV.'],
    ],
  },
  {
    id: 'providers',
    title: 'Other providers',
    paragraphs: [
      ['Direct video, live video (including HLS) and audio or radio streams are played by your browser’s own media player, straight from the provider’s address. They are labelled with that address, never presented as YouTube, and are subject to that provider’s terms.'],
    ],
  },
  {
    id: 'channel-000',
    title: 'WardTV · Channel 000',
    paragraphs: [['Channel 000 is the WardTV channel surfer. It plays a programme airing elsewhere on WardTV, from the channel that carries it, and then chooses another. It copies nothing and learns nothing about you; what it chose is forgotten when you close WardTV.']],
  },
  {
    id: 'channel-1000',
    title: 'Local media · Channel 1000',
    paragraphs: [[`Local Media. ${LOCAL_SESSION_NOTE} It plays from your device for this session only; nothing is uploaded.`]],
  },
  {
    id: 'credits',
    title: 'Credits and provenance',
    paragraphs: [
      ['CREDITS on the remote rolls over the programme you are watching, which carries on playing. It shows what is playing, then the sources behind every channel, generated from the network’s own records. Where a programme has no individual credit, it is credited to the source it comes from; where no creator is recorded, it says so.'],
      ['Credits record provenance. They are not a claim of ownership, and do not mean a source has granted WardTV any licence beyond its provider’s own playback.'],
      ['The source register can be downloaded from the credits as machine-readable JSON.'],
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and external playback',
    paragraphs: [
      ['WardTV has no accounts, sign-in, advertising, analytics or tracking, asks for no personal information, and sets no cookies. Your favourites, settings and this welcome’s acknowledgement are stored only in this browser, apart from any other site.'],
      ['Playing a programme connects your browser to its provider (YouTube, including its player and preview images, or the stream’s own host), which may exchange information with it under its own privacy policy. WardTV loads its typefaces from Google Fonts, so your browser also contacts Google for those. WardTV is served by GitHub Pages, which may keep standard request logs.'],
    ],
  },
  {
    id: 'rights',
    title: 'Rights & attribution',
    paragraphs: [
      ['If you are a creator or rights holder and want a programme or source removed from WardTV or credited differently, we will act promptly.'],
      ['Removing a programme from WardTV does not remove it from its provider. For that, use the provider’s process, such as ', { text: 'YouTube’s copyright tools', href: YOUTUBE_COPYRIGHT }, '.'],
    ],
  },
  {
    id: 'corrections',
    title: 'Corrections',
    paragraphs: [
      ['Credits come from the network’s records and can be wrong or incomplete. Creators, rights holders and source representatives can raise attribution corrections, incorrect creator information, broken or incorrect source links, and source concerns through Contact under Rights & attribution.'],
    ],
  },
  {
    id: 'independence',
    title: 'Independence',
    paragraphs: [
      ['WardTV is independent. It is not operated, affiliated with, endorsed or sponsored by YouTube, Google, or any provider or creator whose programmes appear. Names and trademarks belong to their owners.'],
    ],
  },
  {
    id: 'version',
    title: 'Version',
    paragraphs: [[`${TVN_VERSION} · ${LEGAL_DATE} · ${EDITION.poweredBy} (TVN source ${BUILD_INFO.source})`]],
  },
]
