import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../../components/ui'
import { affiliateReady, readAffiliateIds } from '../shopping/affiliate'
import { sourceName } from '../shopping/sources'
import { clickReport, missedClicks, readShopClicks, resetShopClicks } from './clicks'
import { readRevenueConfig } from './config'
import { inviteText, inviteUrl, myReferralCode } from './referral'
import { whatsappShareHref } from './shareList'

type Step = { id: string; label: string; done: boolean; how: string; href?: string }

function goLiveSteps(): Step[] {
  const config = readRevenueConfig()
  return [
    {
      id: 'affiliate',
      label: 'Affiliate tracking IDs',
      done: affiliateReady(readAffiliateIds()),
      how: 'Join Amazon Associates, Flipkart Affiliate and Cuelinks, then add the IDs as GitHub secrets so every visitor’s clicks earn.',
      href: 'https://affiliate-program.amazon.in/',
    },
    {
      id: 'plus',
      label: 'Willow Plus checkout',
      done: Boolean(config.plusCheckout),
      how: 'Create a ₹199/month Razorpay Subscription or Payment Page and set VITE_PLUS_CHECKOUT_URL.',
      href: 'https://dashboard.razorpay.com/',
    },
    {
      id: 'packs',
      label: 'Learning packs checkout',
      done: Boolean(config.packsCheckout),
      how: 'Create a ₹299 Razorpay Payment Page that delivers the PDF pack, then set VITE_PACKS_CHECKOUT_URL.',
      href: 'https://dashboard.razorpay.com/',
    },
    {
      id: 'leads',
      label: 'Demo requests reach you',
      done: Boolean(config.leadsEndpoint || config.salesWhatsapp || config.salesEmail),
      how: 'Set VITE_SALES_WHATSAPP or VITE_SALES_EMAIL (or a VITE_LEADS_ENDPOINT form URL).',
    },
    {
      id: 'play',
      label: 'Google Play listing',
      done: false,
      how: 'One-time $25 developer account; upload the signed release APK/AAB. Parents trust store installs far more than APKs.',
      href: 'https://play.google.com/console/signup',
    },
  ]
}

export function RevenueSettings() {
  const [clicks, setClicks] = useState(() => readShopClicks())
  const [copied, setCopied] = useState(false)
  const [steps] = useState(goLiveSteps)
  const [code] = useState(myReferralCode)
  const rows = clickReport(clicks, readAffiliateIds())
  const missed = missedClicks(rows)

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteText(code))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="card mb-6 p-5" data-testid="revenue-settings">
      <h2 className="font-display text-xl">Revenue</h2>
      <p className="mt-1 text-sm text-muted">
        What still needs your accounts before Willow can earn. <Link className="text-pine underline" to="/pricing">View the pricing page</Link>.
      </p>
      <ul className="mt-3 space-y-2" data-testid="go-live-steps">
        {steps.map((step) => (
          <li key={step.id} className="rounded-xl border border-line px-3 py-2 text-sm" data-testid={`go-live-${step.id}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{step.label}</span>
              <Badge tone={step.done ? 'pine' : 'gold'}>{step.done ? 'Live' : 'To do'}</Badge>
            </div>
            {!step.done ? (
              <p className="mt-1 text-xs text-muted">
                {step.how}{' '}
                {step.href ? (
                  <a className="text-pine underline" href={step.href} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : null}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <h3 className="mt-5 font-semibold">Store clicks on this device</h3>
      {rows.length ? (
        <>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2" data-testid="shop-clicks">
            {rows.map((row) => (
              <li key={row.source} className="flex justify-between gap-2">
                <span>{sourceName(row.source)}</span>
                <span className={row.program && !row.earning ? 'text-gold' : ''}>
                  {row.clicks} {row.earning ? '· earning' : row.program ? '· no ID yet' : '· no program'}
                </span>
              </li>
            ))}
          </ul>
          {missed ? (
            <p className="mt-2 text-xs text-gold" data-testid="shop-clicks-missed">
              {missed} clicks went to stores with an affiliate program but no tracking ID.
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="mt-2"
            onClick={() => {
              resetShopClicks()
              setClicks({})
            }}
          >
            Reset counts
          </Button>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">No store clicks yet.</p>
      )}

      <h3 className="mt-5 font-semibold">Invite a family</h3>
      <p className="mt-1 text-sm text-muted">
        Your invite code <span className="font-mono font-semibold" data-testid="invite-code">{code}</span> travels with the
        link. Codes are recorded on demo requests and checkouts so you can credit referrers.
      </p>
      <p className="mt-1 break-all font-mono text-xs text-muted">{inviteUrl(code)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          className="inline-flex items-center rounded-xl bg-pine px-3 py-2 text-sm font-semibold text-white"
          href={whatsappShareHref(inviteText(code))}
          target="_blank"
          rel="noreferrer"
          data-testid="invite-whatsapp"
        >
          Invite on WhatsApp
        </a>
        <Button type="button" variant="ghost" onClick={() => void copyInvite()} data-testid="invite-copy">
          {copied ? 'Invite copied' : 'Copy invite'}
        </Button>
      </div>
    </section>
  )
}
