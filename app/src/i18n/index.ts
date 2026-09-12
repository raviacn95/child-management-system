import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { bn, en, hi, kn, ta, type SupportedLang } from './resources'

const KEY = 'willow-lang'

function isLang(value: string | null): value is SupportedLang {
  return value === 'en' || value === 'hi' || value === 'kn' || value === 'ta' || value === 'bn'
}

export function detectLanguage(): SupportedLang {
  try {
    const saved = localStorage.getItem(KEY)
    if (isLang(saved)) return saved
  } catch {
    /* private mode */
  }
  const nav = (typeof navigator === 'undefined' ? 'en' : navigator.language).slice(0, 2).toLowerCase()
  return isLang(nav) ? nav : 'en'
}

export async function initI18n() {
  const lng = detectLanguage()
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn },
      ta: { translation: ta },
      bn: { translation: bn },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  if (typeof document !== 'undefined') document.documentElement.lang = lng
  return i18n
}

export function persistLanguage(lng: string) {
  const next = isLang(lng) ? lng : 'en'
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* private mode */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next
  void i18n.changeLanguage(next)
}

export { SUPPORTED_LANGS } from './resources'
