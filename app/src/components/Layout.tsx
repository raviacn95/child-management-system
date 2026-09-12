import {
  Bus,
  Baby,
  Bot,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Clapperboard,
  Compass,
  ClipboardCheck,
  Download,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorPlay,
  Search,
  Package,
  School,
  Settings,
  ShoppingBag,
  Sparkles,
  Sprout,
  SunMedium,
  Tv,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { prefetchRoute } from '../app/prefetch'
import { persistLanguage } from '../i18n'
import { canSee, formatTime } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'
import { Avatar, Badge } from './ui'
import { ThemeToggle } from './ThemeToggle'
import { ShareButton } from '../features/share/ShareSheet'

const NAV = [
  { to: '/hub', key: 'hub', label: 'Tonight', icon: MonitorPlay },
  { to: '/', key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/movies', key: 'movies', label: 'Movies', icon: Clapperboard },
  { to: '/tv', key: 'tv', label: 'TV tonight', icon: Tv },
  { to: '/ott', key: 'ott', label: 'My OTTs', icon: Wallet },
  { to: '/parent-feed', key: 'parent-feed', label: 'Parent feed', icon: Compass },
  { to: '/learning', key: 'learning', label: 'Learning', icon: BookOpen },
  { to: '/grow', key: 'grow', label: 'Grow at home', icon: Sprout },
  { to: '/children', key: 'children', label: 'Children', icon: Baby },
  { to: '/workers', key: 'workers', label: 'Teacher workers', icon: Bot },
  { to: '/enrollment', key: 'enrollment', label: 'Enrollment', icon: Sparkles },
  { to: '/attendance', key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/daily-care', key: 'daily-care', label: 'Daily care', icon: SunMedium },
  { to: '/health', key: 'health', label: 'Health', icon: HeartPulse },
  { to: '/billing', key: 'billing', label: 'Billing', icon: Wallet },
  { to: '/staff', key: 'staff', label: 'Staff & ratios', icon: Users },
  { to: '/classrooms', key: 'classrooms', label: 'Rooms', icon: School },
  { to: '/messages', key: 'messages', label: 'Messages', icon: MessageSquare },
  { to: '/calendar', key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/meals', key: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/shop', key: 'shop', label: 'Willow Mart', icon: ShoppingBag },
  { to: '/transport', key: 'transport', label: 'Van routes', icon: Bus },
  { to: '/documents', key: 'documents', label: 'Documents', icon: FileText },
  { to: '/inventory', key: 'inventory', label: 'Supplies', icon: Package },
  { to: '/reports', key: 'reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', key: 'settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  const { t, i18n } = useTranslation()
  const { state, logout, setSite, markNotifRead } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [openNotifs, setOpenNotifs] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const user = state.users.find((u) => u.id === state.currentUserId)
  const site = state.sites.find((s) => s.id === state.currentSiteId)
  const pack = packOf(state.countryCode)

  const items = useMemo(() => {
    if (!user) return []
    return NAV.filter((n) => {
      if (n.key === 'enrollment' || n.key === 'inventory' || n.key === 'reports' || n.key === 'settings') {
        return user.role === 'director'
      }
      if (n.key === 'attendance' || n.key === 'staff') return user.role !== 'parent'
      return canSee(user.role, n.key)
    })
  }, [user])

  const notifs = state.notifications.filter((n) => n.userId === user?.id)
  const unread = notifs.filter((n) => !n.read).length

  useEffect(() => {
    setNavOpen(false)
    setOpenNotifs(false)
  }, [location.pathname])

  if (!user) return null

  return (
    <div className="look-shell flex min-h-dvh">
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Close menu"
          data-testid="nav-backdrop"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(248px,86vw)] shrink-0 flex-col border-r border-line bg-[var(--color-sidebar)] pt-[env(safe-area-inset-top)] transition-transform lg:sticky lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="app-nav"
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine text-paper">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-display text-lg leading-none font-semibold">{t('brand')}</p>
              <p className="mt-1 text-[11px] tracking-wide text-muted uppercase">
                {pack.nativeName} · {t('tagline')}
              </p>
            </div>
          </div>
          {user.role === 'director' ? (
            <select
              className="mt-4 w-full rounded-xl border border-line bg-paper px-2.5 py-2 text-sm"
              value={state.currentSiteId}
              onChange={(e) => setSite(e.target.value)}
            >
              {state.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-4 text-xs text-muted">{site?.name}</p>
          )}
        </div>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onMouseEnter={() => prefetchRoute(item.to)}
                onFocus={() => prefetchRoute(item.to)}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-pine text-[var(--color-pine-ink)]' : 'text-ink/80 hover:bg-[var(--nav-hover)]'
                  }`
                }
              >
                <Icon size={16} />
                {t(`nav.${item.key}`)}
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-xl bg-paper px-2 py-2">
            <Avatar name={user.name} hue={user.avatarHue} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted capitalize">{user.role}</p>
            </div>
            <button
              className="rounded-lg p-1.5 text-muted hover:bg-sand"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              aria-label={t('common.signOut')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-[var(--header-bg)] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="relative z-20 shrink-0 rounded-xl border border-line bg-paper p-2 lg:hidden"
              aria-label="Open menu"
              data-testid="open-nav"
              onClick={() => setNavOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted">
                {site?.name} · {pack.name}
              </p>
              <p className="hidden truncate text-xs text-muted sm:block">{site?.address}</p>
            </div>
          </div>
          <div className="relative z-10 flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
            <button
              type="button"
              className="rounded-xl border border-line bg-paper p-2"
              aria-label="Search Willow"
              data-testid="open-search"
              onClick={() => window.dispatchEvent(new Event('willow-search'))}
            >
              <Search size={16} />
            </button>
            <ShareButton iconOnly className="md:hidden" />
            <ShareButton className="hidden md:inline-flex" />
            <NavLink
              to="/get-app"
              onMouseEnter={() => prefetchRoute('/get-app')}
              className="hidden items-center gap-1.5 rounded-xl border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold hover:border-pine sm:inline-flex"
              data-testid="header-get-app"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{t('nav.getApp')}</span>
            </NavLink>
            <span className="hidden sm:inline-flex">
              <Badge tone="pine">{user.role}</Badge>
            </span>
            <button
              type="button"
              className="rounded-xl border border-line bg-paper px-2 py-1 text-xs font-semibold"
              onClick={() => persistLanguage(i18n.language === 'hi' ? 'en' : 'hi')}
              aria-label={t('settings.language')}
            >
              {i18n.language === 'hi' ? 'EN' : 'हिं'}
            </button>
            <ThemeToggle />
            <button
              className="relative rounded-xl border border-line bg-paper p-2"
              onClick={() => setOpenNotifs((v) => !v)}
              aria-label={t('common.notifications')}
            >
              <Bell size={18} />
              {unread > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] text-white">
                  {unread}
                </span>
              ) : null}
            </button>
            {openNotifs ? (
              <div className="card absolute top-12 right-0 z-30 w-[min(20rem,calc(100vw-1.5rem))] p-2">
                {notifs.length === 0 ? (
                  <p className="p-3 text-sm text-muted">No notifications</p>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      className="block w-full rounded-xl p-3 text-left hover:bg-sand"
                      onClick={() => {
                        markNotifRead(n.id)
                        setOpenNotifs(false)
                        navigate(n.href)
                      }}
                    >
                      <p className="text-sm font-semibold">
                        {n.title} {!n.read ? <span className="text-clay">•</span> : null}
                      </p>
                      <p className="text-xs text-muted">{n.body}</p>
                      <p className="mt-1 text-[11px] text-muted">{formatTime(n.at)}</p>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </header>
        <main className="tv-safe px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
