import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en, hi } from './resources'

const KEY = 'willow-lang'

export async function initI18n() {
  const saved = localStorage.getItem(KEY) === 'hi' ? 'hi' : 'en'
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: saved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  return i18n
}

export function persistLanguage(lng: string) {
  localStorage.setItem(KEY, lng)
  void i18n.changeLanguage(lng)
}
