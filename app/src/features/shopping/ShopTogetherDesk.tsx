import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui'
import { useWatchDesk } from '../ott/WatchPane'
import { copyBasketList } from './baskets'
import { launchOfficialShop } from './launch'
import type { RankedShopPick } from './recommend'
import { isOfficialShopUrl, sourceName, type ShopSourceId } from './sources'
import { recordShopBlocked } from './telemetry'
import { searchesForApp, selectedTogetherList, togetherHasPii, TOGETHER_APPS } from './together'

export function ShopTogetherDesk({ picks }: { picks: RankedShopPick[] }) {
  const watch = useWatchDesk()
  const [selected, setSelected] = useState<string[]>(() => picks.map((pick) => pick.id))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setSelected(picks.map((pick) => pick.id))
  }, [picks])

  const rows = useMemo(() => searchesForApp(picks, 'zepto'), [picks])
  const chosen = selectedTogetherList(rows, selected)

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id]))
  }

  function toggleAll() {
    setSelected((cur) => (cur.length === picks.length ? [] : picks.map((pick) => pick.id)))
  }

  async function openCombined(source: ShopSourceId) {
    const app = chosen.apps.find((row) => row.source === source) ?? chosen.apps[0]
    if (
      !app ||
      !chosen.rows.length ||
      togetherHasPii(chosen.rows, `${chosen.combinedQuery} ${app.officialUrl}`) ||
      !isOfficialShopUrl(app.officialUrl)
    ) {
      recordShopBlocked()
      return
    }
    await copyBasketList(chosen.listText)
    setCopied(true)
    const screen = `${window.location.pathname}${window.location.search}`
    const title = `${chosen.rows.length} ticked items`
    if (watch) watch.openOfficialNow({ url: app.officialUrl, title, platformName: app.sourceName })
    else launchOfficialShop({ url: app.officialUrl, title, sourceName: app.sourceName, screen })
  }

  if (!picks.length) return null

  return (
    <div className="shop-together card mb-6 p-4" data-testid="shop-together">
      <h3 className="font-display text-xl font-semibold">Search together</h3>
      <p className="mt-1 text-sm text-muted">
        Tick items once. Every delivery-app search below gets those names in one query, so the app shows the whole list
        at once. Add and pay there yourself — Willow does not place the order.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" data-testid="shop-together-all" onClick={toggleAll}>
          {selected.length === picks.length ? 'Clear selection' : 'Select all items'}
        </Button>
        <Button
          type="button"
          data-testid="shop-together-open"
          disabled={!chosen.rows.length}
          onClick={() => void openCombined('zepto')}
        >
          Open all ticked in Zepto
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted" data-testid="shop-together-count">
        {chosen.rows.length} ticked · one search per app
        {copied ? ' · names copied to paste if the app asks' : ''}
      </p>
      <ul className="mt-3 space-y-2" data-testid="shop-together-list">
        {rows.map((row) => (
          <li key={row.pickId} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(row.pickId)}
                onChange={() => toggle(row.pickId)}
                data-testid="shop-together-check"
              />
              <span className="min-w-0">
                <span className="font-semibold">{row.title}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {row.query} · ₹{row.price} · {row.deliveryTime}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {chosen.combinedQuery ? (
        <div className="mt-4 rounded-xl border border-line p-3" data-testid="shop-together-combo">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">All ticked names in one search</p>
          <p className="mt-1 text-sm font-semibold">{chosen.combinedQuery}</p>
        </div>
      ) : null}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Open that whole list in</p>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="shop-together-apps">
          {TOGETHER_APPS.map((id) => (
            <button
              key={id}
              type="button"
              className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
              data-testid={`shop-together-app-${id}`}
              disabled={!chosen.rows.length}
              onClick={() => void openCombined(id)}
            >
              {sourceName(id)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
