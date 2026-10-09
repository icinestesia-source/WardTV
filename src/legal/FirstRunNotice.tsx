import { acknowledgeNotice, openAbout } from './about-store.ts'
import { GOOGLE_PRIVACY, YOUTUBE_TERMS } from './legal-text.ts'
import { EDITION } from '../edition.ts'
import logo from '../assets/wardtv-logo.png'

/**
 * The WardTV welcome, shown once per browser; About · Sources · Legal stays in Options afterwards. WATCH TV carries on with
 * the random channel already tuned behind it, CHANNEL GUIDE opens the Guide, and INFORMATION opens About and returns here.
 * There is no account and nothing to choose: every browser starts as a new viewer.
 */
export function FirstRunNotice({ openGuide = () => undefined }: { openGuide?: () => void }) {
  const watch = () => acknowledgeNotice()
  const guide = () => {
    acknowledgeNotice()
    openGuide()
  }

  return (
    <section className="first-run wardtv-welcome" role="dialog" aria-label={`Welcome to ${EDITION.name}`} onKeyDown={(event) => event.stopPropagation()}>
      <img className="wardtv-welcome-logo" src={logo} alt="" width={160} height={160} />
      <h1 className="first-run-head">Welcome to {EDITION.name}</h1>
      <p className="wardtv-welcome-tagline">{EDITION.tagline}</p>
      <p className="wardtv-welcome-lead">Choose a channel, explore the guide or simply start watching.</p>
      <div className="first-run-actions wardtv-welcome-actions">
        <button type="button" className="wardtv-primary" onClick={watch} autoFocus>
          WATCH TV
        </button>
        <button type="button" onClick={guide}>
          CHANNEL GUIDE
        </button>
        <button type="button" onClick={() => openAbout()} title="About, sources, privacy and legal information">
          INFORMATION
        </button>
      </div>
      <p className="wardtv-welcome-note">
        No account, no adverts and no tracking. Programmes stay hosted and delivered by their providers; YouTube programmes play in
        YouTube’s embedded player under the{' '}
        <a href={YOUTUBE_TERMS} target="_blank" rel="noopener noreferrer">
          YouTube Terms of Service
        </a>{' '}
        and{' '}
        <a href={GOOGLE_PRIVACY} target="_blank" rel="noopener noreferrer">
          Google Privacy Policy
        </a>
        . {EDITION.poweredBy}.
      </p>
    </section>
  )
}
