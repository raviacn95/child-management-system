import { beginAway, hasPii, issueReturnToken } from '../ott/returnSession'
import { openOfficialApp } from '../ott/watchDesk'
import { isOfficialShopUrl } from './sources'

export function launchOfficialShop(input: { url: string; title: string; sourceName: string; screen: string }) {
  if (!isOfficialShopUrl(input.url)) return null
  const record = issueReturnToken({
    screen: input.screen,
    label: input.sourceName.slice(0, 80),
    title: input.title.slice(0, 120),
  })
  if (hasPii(record)) return null
  const away = beginAway(record, input.url)
  openOfficialApp(input.url)
  return away
}
