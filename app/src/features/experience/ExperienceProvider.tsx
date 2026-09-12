import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { applyDeviceChrome, detectFireTv } from '../../lib/tv'
import { useStore } from '../../store'
import { useTheme } from '../../theme/ThemeProvider'
import type { LookId } from '../../theme/looks'
import { CommandPalette } from './CommandPalette'
import { LookSplash } from './LookSplash'
import { OfflineBanner } from './OfflineBanner'
import { PinLock } from './PinLock'
import {
  applyChrome,
  hasProfile,
  pushResume,
  readProfile,
  unlockAchievement,
  writeProfile,
  type AccentId,
  type AchievementId,
  type ExperienceProfile,
} from './profile'

type ExperienceApi = {
  profile: ExperienceProfile
  splash: boolean
  dismissSplash: () => void
  patch: (next: Partial<ExperienceProfile>) => void
  remember: (card: { id: string; kind: ExperienceProfile['resume'][number]['kind']; title: string; href: string }) => void
  earn: (id: AchievementId) => void
}

const Ctx = createContext<ExperienceApi | null>(null)
const shown = new Set<string>()

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const { look, setLook } = useTheme()
  const lookRef = useRef(look)
  lookRef.current = look
  const location = useLocation()
  const userId = state.currentUserId
  const lastUser = useRef<string | null>(null)
  const [profile, setProfile] = useState<ExperienceProfile>(() => readProfile(userId ?? 'guest', detectFireTv()))
  const [splash, setSplash] = useState(false)

  useEffect(() => {
    applyDeviceChrome()
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = () => applyDeviceChrome()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!userId && lastUser.current) {
      const prev = readProfile(lastUser.current)
      if (prev.pin) writeProfile(lastUser.current, { locked: true })
    }
    lastUser.current = userId
    if (!userId) return
    const next = hasProfile(userId)
      ? readProfile(userId, detectFireTv())
      : writeProfile(userId, { look: lookRef.current })
    setProfile(next)
    setLook(next.look, { persist: true })
    applyChrome(next)
    if (!shown.has(userId)) {
      shown.add(userId)
      setSplash(true)
      window.setTimeout(() => setSplash(false), 1400)
    }
  }, [userId, setLook])

  useEffect(() => {
    applyChrome(profile)
  }, [profile])

  useEffect(() => {
    if (!userId) return
    if (location.pathname === '/login' || location.pathname === '/get-app') return
    pushResume(userId, {
      id: `page-${location.pathname}`,
      kind: 'page',
      title: location.pathname === '/hub' ? 'Household Hub' : location.pathname.slice(1) || 'Home',
      href: `${location.pathname}${location.search}`,
      at: Date.now(),
    })
  }, [location.pathname, location.search, userId])

  const api = useMemo<ExperienceApi>(
    () => ({
      profile,
      splash,
      dismissSplash: () => setSplash(false),
      patch: (next) => {
        if (!userId) return
        const saved = writeProfile(userId, next)
        setProfile(saved)
        if (next.look) setLook(next.look as LookId, { persist: true })
        applyChrome(saved)
      },
      remember: (card) => {
        if (!userId) return
        setProfile(pushResume(userId, { ...card, at: Date.now() }))
      },
      earn: (id) => {
        if (!userId) return
        setProfile((prev) => (prev.achievements.includes(id) ? prev : unlockAchievement(userId, id)))
      },
    }),
    [profile, splash, userId, setLook],
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      <LookSplash />
      <PinLock />
      <OfflineBanner />
      <CommandPalette />
    </Ctx.Provider>
  )
}

export function useExperience() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ExperienceProvider missing')
  return ctx
}

export function useExperienceOptional() {
  return useContext(Ctx)
}

export function useAccent(): AccentId {
  return useExperience().profile.accent
}
