import { useTv } from '../state/tv-context.ts'

export function Hints() {
  const { hintsOn, guideOpen } = useTv()
  if (!hintsOn || guideOpen) return null

  return (
    <p className="hints">
      ↑↓ Channel · G Guide · I Info · 0–9 Tune · ⌫ Last · , . Prev/Next · Space Surf · P Pause · S Favourite · M Mute · / Multi · R All / Fav · T Cycle · − = Guide zoom · Home now
    </p>
  )
}
