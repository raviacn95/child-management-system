import { useEffect, useState } from 'react'

const WIDE = '(min-width: 768px)'

export function useWideScreen() {
  const [wide, setWide] = useState(() => typeof window.matchMedia !== 'function' || window.matchMedia(WIDE).matches)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(WIDE)
    const sync = () => setWide(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  return wide
}
