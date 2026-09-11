import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COUNTRIES, packOf, type CountryCode } from '../data/country'
import { Badge, Button, PageHead, inputClass } from '../components/ui'
import { persistLanguage } from '../i18n'
import { PRODUCTION_CSP } from '../lib/csp'
import { DEFAULT_FLAGS, readFlags, writeFlags, type FeatureFlags } from '../lib/flags'
import { formatTime } from '../lib'
import { useStore } from '../store'
import { useTheme, type ThemeChoice } from '../theme/ThemeProvider'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { state, resetDemo, setCountry } = useStore()
  const { theme, setTheme } = useTheme()
  const pack = packOf(state.countryCode)
  const [flags, setFlags] = useState<FeatureFlags>(() => readFlags())

  function toggleFlag(key: keyof FeatureFlags) {
    const next = { ...flags, [key]: !flags[key] }
    setFlags(next)
    writeFlags(next)
  }

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle="Country pack drives currency, GST/VAT, UIP vaccines, stages, documents, COD, and holidays — the same split Indian preschool ERPs (Pathshala, Fledgly, Zenox, OpenEduCat) use."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-display text-xl">{t('settings.appearance')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['light', 'dark', 'system'] as ThemeChoice[]).map((choice) => (
              <button
                key={choice}
                type="button"
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  theme === choice ? 'bg-pine text-white' : 'border border-line'
                }`}
                onClick={() => setTheme(choice)}
              >
                {t(`theme.${choice}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-xl">{t('settings.language')}</h2>
          <div className="mt-3 flex gap-2">
            {['en', 'hi'].map((lng) => (
              <button
                key={lng}
                type="button"
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  i18n.language === lng ? 'bg-pine text-white' : 'border border-line'
                }`}
                onClick={() => persistLanguage(lng)}
              >
                {lng === 'en' ? 'English' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-xl">{t('settings.security')}</h2>
          <p className="mt-2 text-xs text-muted">Production builds inject a CSP meta tag. Dev keeps HMR unblocked.</p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed break-all text-muted">{PRODUCTION_CSP}</p>
        </div>
      </div>

      <div className="card mb-6 p-5">
        <h2 className="font-display text-xl">{t('settings.flags')}</h2>
        <p className="mt-1 text-sm text-muted">Custom toggles (LaunchDarkly-shaped). Defaults come from typed env vars.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(DEFAULT_FLAGS) as (keyof FeatureFlags)[]).map((key) => (
            <li key={key} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${flags[key] ? 'bg-pine text-white' : 'bg-sand text-muted'}`}
                onClick={() => toggleFlag(key)}
                aria-pressed={flags[key]}
              >
                {flags[key] ? 'On' : 'Off'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card mb-6 p-5">
        <h2 className="font-display text-xl">Country pack</h2>
        <p className="mt-1 text-sm text-muted">
          Active: {pack.nativeName} · {pack.currency} · {pack.academicYear} · {pack.messaging}
        </p>
        <select
          className={`${inputClass} mt-3 max-w-md`}
          value={state.countryCode}
          onChange={(e) => setCountry(e.target.value as CountryCode)}
        >
          {Object.values(COUNTRIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.currency})
            </option>
          ))}
        </select>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p>
            <strong>Stages:</strong> {pack.stages.map((s) => s.label).join(', ')}
          </p>
          <p>
            <strong>Payments:</strong> {pack.payments.map((p) => p.label).join(', ')}
          </p>
          <p>
            <strong>Vaccines:</strong> {pack.vaccineProgram}
          </p>
          <p>
            <strong>COD:</strong> {pack.cod.enabled ? `${pack.cod.label} ${pack.symbol}${pack.cod.min}–${pack.cod.max}` : 'Off'}
          </p>
          <p className="md:col-span-2">
            <strong>ID rule:</strong> {pack.idHint}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {state.sites.map((s) => (
          <article key={s.id} className="card p-5">
            <h2 className="font-display text-xl">{s.name}</h2>
            <p className="mt-1 text-sm text-muted">{s.address}</p>
            <p className="mt-3 text-sm">{s.phone}</p>
            {s.whatsapp ? <p className="text-sm">WhatsApp {s.whatsapp}</p> : null}
            <p className="text-sm">License {s.license}</p>
            {s.gstin ? <p className="text-sm">GSTIN {s.gstin}</p> : null}
            {s.udise ? <p className="text-sm">U-DISE {s.udise}</p> : null}
            {s.fssai ? <p className="text-sm">FSSAI {s.fssai}</p> : null}
            {s.affiliation ? <p className="text-sm">{s.affiliation}</p> : null}
            <p className="text-sm">Licensed capacity {s.capacity}</p>
            <div className="mt-2">
              <Badge tone="pine">{s.state ?? pack.name}</Badge>
            </div>
          </article>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-display text-xl">{t('settings.audit')}</h2>
        <p className="mt-1 text-sm text-muted">Sign-in, observations, and recommendation exports. Last 20 shown.</p>
        <div className="mt-3 space-y-2">
          {(state.auditLog ?? []).slice(0, 20).map((entry) => (
            <p key={entry.id} className="rounded-xl bg-sand px-3 py-2 text-sm">
              <span className="font-semibold">{entry.action}</span> · {entry.details}
              <span className="ml-2 text-xs text-muted">{formatTime(entry.at)}</span>
            </p>
          ))}
          {(state.auditLog ?? []).length === 0 ? <p className="text-sm text-muted">No events yet.</p> : null}
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-display text-xl">Demo data</h2>
        <p className="mt-1 text-sm text-muted">
          Willow stores everything in this browser. Reset to restore the India-seeded multi-site centre (Bengaluru, Mumbai, Delhi).
        </p>
        <Button className="mt-4" variant="danger" onClick={resetDemo}>
          Reset demo
        </Button>
      </div>
    </div>
  )
}
