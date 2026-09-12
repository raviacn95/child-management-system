import { useState, type FormEvent } from 'react'
import { Button, Field, inputClass } from '../../components/ui'
import { affiliateReady, readAffiliateIds, writeAffiliateIds, type AffiliateIds } from './affiliate'

export function AffiliateSettings() {
  const [ids, setIds] = useState<AffiliateIds>(() => readAffiliateIds())
  const [saved, setSaved] = useState(false)

  function update<K extends keyof AffiliateIds>(key: K, value: string) {
    setIds((cur) => ({ ...cur, [key]: value }))
    setSaved(false)
  }

  function save(event: FormEvent) {
    event.preventDefault()
    setIds(writeAffiliateIds(ids))
    setSaved(true)
  }

  return (
    <form className="card mb-6 p-5" data-testid="affiliate-settings" onSubmit={save}>
      <h2 className="font-display text-xl">Affiliate revenue</h2>
      <p className="mt-1 text-sm text-muted">
        Paste public tracking IDs from Flipkart Affiliate, Amazon Associates, Meesho, Cuelinks, or Admitad. Checkout
        stays on those sites. API secrets never go in this app. Child names are not added to links.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Flipkart Affiliate ID">
          <input
            className={inputClass}
            value={ids.flipkartAffid}
            onChange={(e) => update('flipkartAffid', e.target.value)}
            placeholder="your Flipkart affid"
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
            : 'Saved. Add at least one ID when you have an affiliate account.'
          : affiliateReady(ids)
            ? 'Tracking IDs are on this device and will attach to official shop links.'
            : 'No IDs yet — links stay official, commission starts when you save an ID.'}
      </p>
    </form>
  )
}
