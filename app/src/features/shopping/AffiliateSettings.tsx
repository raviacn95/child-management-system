import { useState, type FormEvent } from 'react'
import { Button, Field, inputClass } from '../../components/ui'
import { LIVE_SITE } from '../install/assets'
import { AFFILIATE_PROGRAMS, affiliateReady, readAffiliateIds, writeAffiliateIds, type AffiliateIds } from './affiliate'

export function AffiliateSettings() {
  const [ids, setIds] = useState<AffiliateIds>(() => readAffiliateIds())
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function update<K extends keyof AffiliateIds>(key: K, value: string) {
    setIds((cur) => ({ ...cur, [key]: value }))
    setSaved(false)
  }

  function save(event: FormEvent) {
    event.preventDefault()
    setIds(writeAffiliateIds(ids))
    setSaved(true)
  }

  async function copySite() {
    try {
      await navigator.clipboard.writeText(LIVE_SITE)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <form className="card mb-6 p-5" data-testid="affiliate-settings" onSubmit={save}>
      <h2 className="font-display text-xl">Affiliate revenue</h2>
      <p className="mt-1 text-sm text-muted">
        Willow cannot open Flipkart or Amazon accounts for you. Apply on each official program with this Willow site,
        then paste the public tracking IDs here. Checkout stays on those sites. API secrets stay off this device.
      </p>
      <p className="mt-3 break-all font-mono text-xs" data-testid="aff-site">
        Website to submit: {LIVE_SITE}
      </p>
      <Button type="button" variant="ghost" className="mt-2" data-testid="aff-copy-site" onClick={() => void copySite()}>
        {copied ? 'Copied Willow site' : 'Copy Willow site'}
      </Button>
      <div className="mt-3 flex flex-wrap gap-2" data-testid="aff-apply">
        {AFFILIATE_PROGRAMS.map((program) => (
          <a
            key={program.id}
            className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-pine"
            href={program.href}
            target="_blank"
            rel="noreferrer"
          >
            Apply {program.name}
          </a>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Flipkart Affiliate ID">
          <input
            className={inputClass}
            value={ids.flipkartAffid}
            onChange={(e) => update('flipkartAffid', e.target.value)}
            placeholder="Flipkart affid after approval"
            autoComplete="off"
            data-testid="aff-flipkart"
          />
        </Field>
        <Field label="Amazon Associates tag">
          <input
            className={inputClass}
            value={ids.amazonTag}
            onChange={(e) => update('amazonTag', e.target.value)}
            placeholder="yourtag-21"
            autoComplete="off"
            data-testid="aff-amazon"
          />
        </Field>
        <Field label="Meesho affiliate ID">
          <input
            className={inputClass}
            value={ids.meeshoId}
            onChange={(e) => update('meeshoId', e.target.value)}
            placeholder="Meesho or network ID"
            autoComplete="off"
            data-testid="aff-meesho"
          />
        </Field>
        <Field label="Cuelinks publisher ID">
          <input
            className={inputClass}
            value={ids.cuelinksPubId}
            onChange={(e) => update('cuelinksPubId', e.target.value)}
            placeholder="for Myntra / Nykaa / Meesho"
            autoComplete="off"
            data-testid="aff-cuelinks"
          />
        </Field>
        <Field label="Admitad campaign code">
          <input
            className={inputClass}
            value={ids.admitadCode}
            onChange={(e) => update('admitadCode', e.target.value)}
            placeholder="Admitad deeplink code"
            autoComplete="off"
            data-testid="aff-admitad"
          />
        </Field>
      </div>
      <Button type="submit" className="mt-4" data-testid="aff-save">
        Save tracking IDs
      </Button>
      <p className="mt-2 text-sm text-muted" data-testid="aff-status">
        {saved
          ? affiliateReady(ids)
            ? 'Saved. Official shop links now carry your tracking IDs.'
            : 'Saved. Add at least one ID when the official program approves you.'
          : affiliateReady(ids)
            ? 'Tracking IDs are on this device and will attach to official shop links.'
            : 'No IDs yet — apply above, then paste the public IDs so Willow can earn on those clicks.'}
      </p>
    </form>
  )
}
