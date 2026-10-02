import { Download, Menu, RefreshCw, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { prefetchRoute } from '../app/prefetch'
import { ShareButton } from '../features/share/ShareSheet'
import { persistLanguage } from '../i18n'
import { ThemeToggle } from './ThemeToggle'

export type ShellNavItem = { to: string; key: string; label: string; icon: LucideIcon }

type SourceUpdate = { busy: boolean; message?: string; headerLabel: string; run: () => Promise<unknown> | void }

export function HeaderTools({ update, roleBadge }: { update: SourceUpdate; roleBadge: ReactNode }) {
  const { t, i18n } = useTranslation()
  return (
    <>
      <button
        type="button"
        className="shell-tool"
        aria-label="Check official Willow source and update"
        data-testid="header-update"
        disabled={update.busy}
        title={update.message || 'Check the official Willow source'}
        onClick={() => void update.run()}
      >
        <RefreshCw size={14} className={update.busy ? 'animate-spin' : undefined} />
        <span>{update.headerLabel}</span>
      </button>
      <ShareButton className="shell-tool" />
      <NavLink
        to="/get-app"
        onMouseEnter={() => prefetchRoute('/get-app')}
        className="shell-tool"
        data-testid="header-get-app"
      >
        <Download size={14} />
        <span>{t('nav.getApp')}</span>
      </NavLink>
      {roleBadge}
      <button
        type="button"
        className="shell-tool"
        onClick={() => persistLanguage(i18n.language === 'hi' ? 'en' : 'hi')}
        aria-label={t('settings.language')}
      >
        {i18n.language === 'hi' ? 'EN' : 'हिं'}
      </button>
      <ThemeToggle />
    </>
  )
}

export function DrawerTools({ update }: { update: SourceUpdate }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="drawer-tools" data-testid="drawer-tools">
      <button
        type="button"
        className="drawer-tool"
        data-testid="drawer-update"
        disabled={update.busy}
        onClick={() => void update.run()}
      >
        <RefreshCw size={16} className={update.busy ? 'animate-spin' : undefined} />
        <span>{update.headerLabel}</span>
      </button>
      <NavLink to="/get-app" className="drawer-tool" data-testid="drawer-get-app">
        <Download size={16} />
        <span>{t('nav.getApp')}</span>
      </NavLink>
      <ShareButton className="drawer-tool" />
      <button
        type="button"
        className="drawer-tool"
        onClick={() => persistLanguage(i18n.language === 'hi' ? 'en' : 'hi')}
        aria-label={t('settings.language')}
      >
        <span>{i18n.language === 'hi' ? 'English' : 'हिंदी'}</span>
      </button>
      <ThemeToggle />
    </div>
  )
}

export function PhoneTabs({
  items,
  menuOpen,
  onMore,
}: {
  items: ShellNavItem[]
  menuOpen: boolean
  onMore: () => void
}) {
  const { t } = useTranslation()
  return (
    <nav className="phone-tabs" aria-label="Main" data-testid="phone-tabs">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onTouchStart={() => prefetchRoute(item.to)}
            className={({ isActive }) => `phone-tab${isActive ? ' phone-tab-active' : ''}`}
            data-testid={`phone-tab-${item.key}`}
          >
            <span className="phone-tab-icon">
              <Icon size={20} aria-hidden />
            </span>
            <span className="phone-tab-label">{t(`nav.${item.key}`)}</span>
          </NavLink>
        )
      })}
      <button
        type="button"
        className={`phone-tab${menuOpen ? ' phone-tab-active' : ''}`}
        aria-expanded={menuOpen}
        aria-controls="app-nav"
        data-testid="phone-tab-more"
        onClick={onMore}
      >
        <span className="phone-tab-icon">
          <Menu size={20} aria-hidden />
        </span>
        <span className="phone-tab-label">More</span>
      </button>
    </nav>
  )
}
