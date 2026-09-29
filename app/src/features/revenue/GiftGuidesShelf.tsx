import { useMemo } from 'react'
import { useWatchDesk } from '../ott/WatchPane'
import { launchOfficialShop } from '../shopping/launch'
import { isOfficialShopUrl, sourceName, type ShopSourceId } from '../shopping/sources'
import { recordShopBlocked } from '../shopping/telemetry'
import { recordShopClick } from './clicks'
import { activeGiftGuides, giftLink, GIFT_SOURCES, type GiftItem } from './giftGuides'

export function GiftGuidesShelf() {
  const watch = useWatchDesk()
  const guides = useMemo(() => activeGiftGuides(), [])

  function open(item: GiftItem, source: ShopSourceId) {
    const url = giftLink(item, source)
    if (!isOfficialShopUrl(url)) {
      recordShopBlocked()
      return
    }
    recordShopClick(source)
    const name = sourceName(source)
    if (watch) watch.openOfficialNow({ url, title: item.title, platformName: name })
    else launchOfficialShop({ url, title: item.title, sourceName: name, screen: window.location.pathname })
  }

  return (
    <section className="card mb-6 p-4" data-testid="gift-guides">
      <h3 className="font-display text-xl font-semibold">Gift guides</h3>
      <p className="mt-1 text-sm text-muted">Seasonal picks. Tapping a store opens its official search — you buy there.</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <div key={guide.id} data-testid={`gift-guide-${guide.id}`}>
            <p className="font-semibold">{guide.title}</p>
            <p className="text-xs text-muted">{guide.blurb}</p>
            <ul className="mt-2 space-y-2">
              {guide.items.map((item) => (
                <li key={item.title} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                  <span>{item.title}</span>
                  <span className="flex gap-1.5">
                    {GIFT_SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-pine hover:border-pine"
                        onClick={() => open(item, source)}
                      >
                        {sourceName(source)}
                      </button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
