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
import { canOpen, formatTime } from '../lib'
import { packOf } from '../data/country'
import { useStore } from '../store'
import { Avatar, Badge } from './ui'
import { UpdateBanner } from '../features/install/UpdateBanner'
import { useSourceUpdate } from '../features/install/useSourceUpdate'
import { rememberLivingRoom } from '../lib/tv'
import { TvStrip } from './TvStrip'
import { groupNav, phoneTabs } from './shellNav'
import { DrawerTools, HeaderTools, PhoneTabs, type ShellNavItem } from './ShellParts'
import { useWideScreen } from './useWideScreen'

const NAV: ShellNavItem[] = [
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
  const { t } = useTranslation()
  const { state, logout, setSite, markNotifRead } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [openNotifs, setOpenNotifs] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const wide = useWideScreen()
  const user = state.users.find((u) => u.id === state.currentUserId)
  const site = state.sites.find((s) => s.id === state.currentSiteId)
  const pack = packOf(state.countryCode)

  const items = useMemo(() => {
    if (!user) return []
    return NAV.filter((n) => canOpen(user.role, n.key))
  }, [user])
  const groups = useMemo(() => groupNav(items), [items])
  const tabs = useMemo(() => {
    if (!user) return []
    const keys = phoneTabs(
      user.role,
      items.map((i) => i.key),
    )
    return keys.map((key) => items.find((i) => i.key === key)!)
  }, [items, user])

  const notifs = state.notifications.filter((n) => n.userId === user?.id)
  const unread = notifs.filter((n) => !n.read).length
  const sourceUpdate = useSourceUpdate()
  const [tv, setTv] = useState(() => rememberLivingRoom())

  useEffect(() => {
    function syncTv() {
      setTv(rememberLivingRoom())
    }
    syncTv()
    window.addEventListener('resize', syncTv)
    return () => window.removeEventListener('resize', syncTv)
  }, [])

  useEffect(() => {
    setNavOpen(false)
    setOpenNotifs(false)
  }, [location.pathname])

  if (!user) return null

  if (tv) {
    return (
      <div className="look-shell tv-shell min-h-dvh">
        <TvStrip role={user.role} siteName={site?.name} />
        <UpdateBanner />
        <main className="app-main tv-safe tv-main">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="look-shell has-phone-tabs flex min-h-dvh">
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          data-testid="nav-backdrop"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <aside
        id="app-nav"
        className={`shell-drawer fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(272px,86vw)] shrink-0 flex-col border-r border-line bg-[var(--color-sidebar)] pt-[env(safe-area-inset-top)] transition-transform lg:sticky lg:w-[248px] lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="app-nav"
      >
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="shell-mark">
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
              aria-label="Centre"
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
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="All pages">
          {groups.map((group) => (
            <section key={group.id} className="shell-nav-group" aria-labelledby={`nav-group-${group.id}`}>
              <h2 id={`nav-group-${group.id}`} className="shell-nav-heading">
                {group.label}
              </h2>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onMouseEnter={() => prefetchRoute(item.to)}
                    onFocus={() => prefetchRoute(item.to)}
                    className={({ isActive }) => `shell-nav-link${isActive ? ' shell-nav-link-active' : ''}`}
                  >
                    <Icon size={17} aria-hidden />
                    {t(`nav.${item.key}`)}
                  </NavLink>
                )
              })}
            </section>
          ))}
        </nav>
        {wide ? null : <DrawerTools update={sourceUpdate} />}
        <div className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 rounded-xl bg-paper px-2 py-2">
            <Avatar name={user.name} hue={user.avatarHue} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted capitalize">{user.role}</p>
            </div>
            <button
              className="rounded-lg p-2 text-muted hover:bg-sand"
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
        <header className="shell-header sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-[var(--header-bg)] px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-md md:px-8 md:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              className="shell-icon-btn lg:hidden"
              aria-label="Open menu"
              data-testid="open-nav"
              onClick={() => setNavOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold md:text-sm md:font-normal md:text-muted">
                {site?.name}
                <span className="hidden md:inline"> · {pack.name}</span>
              </p>
              <p className="truncate text-xs text-muted">
                <span className="md:hidden">{pack.name}</span>
                <span className="hidden sm:inline md:inline">{site?.address}</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 flex shrink-0 items-center justify-end gap-1.5 md:gap-2.5">
            {wide ? (
              <HeaderTools
                update={sourceUpdate}
                roleBadge={<Badge tone="pine">{user.role}</Badge>}
              />
            ) : null}
            <button
              type="button"
              className="shell-icon-btn"
              aria-label="Search Willow"
              data-testid="open-search"
              onClick={() => window.dispatchEvent(new Event('willow-search'))}
            >
              <Search size={18} />
            </button>
            <button
              className="shell-icon-btn relative"
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
        <UpdateBanner />
        <main className="app-main px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
      {wide ? null : <PhoneTabs items={tabs} menuOpen={navOpen} onMore={() => setNavOpen((open) => !open)} />}
    </div>
  )
}
