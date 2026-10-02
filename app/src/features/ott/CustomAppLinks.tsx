import { ExternalLink, Play } from 'lucide-react'
import { Button } from '../../components/ui'
import { appsForShelf, customAppLink, useCustomApps } from './customApps'
import { useOpenWatch } from './WatchPane'

export function CustomAppLinks({
  title,
  year,
  shelf = 'family',
  look = 'chip',
}: {
  title: string
  year?: number
  shelf?: 'family' | 'erotic'
  look?: 'chip' | 'tv'
}) {
  const apps = appsForShelf(useCustomApps(), shelf)
  const openWatch = useOpenWatch()
  if (apps.length === 0) return null

  return apps.map((app) => {
    const href = customAppLink(app, title, year)
    const open = () => openWatch({ url: href, title, platformName: app.name })
    const label = app.searchUrl ? `Search ${title} on ${app.name}` : `Open ${app.name}`
    if (look === 'tv') {
      return (
        <Button
          key={app.id}
          variant="ghost"
          data-tv-focus="1"
          data-custom-app={app.id}
          aria-label={label}
          onClick={open}
        >
          <Play size={18} /> {app.name}
        </Button>
      )
    }
    return (
      <a
        key={app.id}
        data-custom-app={app.id}
        className="rounded-lg border border-dashed border-line px-2 py-1 text-xs font-semibold text-pine hover:border-pine"
        data-tv-focus="1"
        href={href}
        rel="noopener noreferrer"
        aria-label={label}
        onClick={(e) => {
          e.preventDefault()
          open()
        }}
      >
        {app.searchUrl ? (
          <>
            Search {app.name} <ExternalLink className="inline" size={10} />
          </>
        ) : (
          app.name
        )}
      </a>
    )
  })
}
