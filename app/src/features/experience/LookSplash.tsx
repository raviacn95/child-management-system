import { useExperience } from './ExperienceProvider'

const COPY: Record<string, string> = {
  grove: 'Care, tonight',
  cinema: 'Family night',
  harbor: 'The desk is ready',
}

export function LookSplash() {
  const { splash, profile, dismissSplash } = useExperience()
  if (!splash) return null
  return (
    <button
      type="button"
      data-testid="look-splash"
      data-look={profile.look}
      className={`look-splash look-splash-${profile.look}`}
      onClick={dismissSplash}
      aria-label="Continue into Willow"
    >
      <span className="look-splash-mark">Willow</span>
      <span className="look-splash-line">{COPY[profile.look] ?? 'Household Hub'}</span>
    </button>
  )
}
