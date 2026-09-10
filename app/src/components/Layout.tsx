import {
  Baby,
  Bot,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  School,
  Settings,
  ShoppingBag,
  Sparkles,
  Sprout,
  SunMedium,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { canSee, formatTime } from '../lib'
import { useStore } from '../store'
import { Avatar, Badge } from './ui'

const NAV = [
  { to: '/', key: 'dashboard', label: 'Home', icon: LayoutDashboard },
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
  { to: '/learning', key: 'learning', label: 'Learning', icon: BookOpen },
  { to: '/meals', key: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/shop', key: 'shop', label: 'Clothing shop', icon: ShoppingBag },
  { to: '/documents', key: 'documents', label: 'Documents', icon: FileText },
  { to: '/inventory', key: 'inventory', label: 'Supplies', icon: Package },
  { to: '/reports', key: 'reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', key: 'settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  const { state, logout, setSite, markNotifRead } = useStore()
  const navigate = useNavigate()
  const [openNotifs, setOpenNotifs] = useState(false)
  const user = state.users.find((u) => u.id === state.currentUserId)
  const site = state.sites.find((s) => s.id === state.currentSiteId)

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

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-line bg-[#fbf7f1]">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine text-paper">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-display text-lg leading-none font-semibold">Willow</p>
              <p className="mt-1 text-[11px] tracking-wide text-muted uppercase">Childcare OS</p>
            </div>
          </div>
          {user.role === 'director' ? (
            <select
              className="mt-4 w-full rounded-xl border border-line bg-white px-2.5 py-2 text-sm"
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
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-pine text-white' : 'text-ink/80 hover:bg-white'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-xl bg-white px-2 py-2">
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
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-[rgba(243,238,230,0.86)] px-8 py-3 backdrop-blur">
          <div>
            <p className="text-sm text-muted">{site?.name}</p>
            <p className="text-xs text-muted">{site?.address}</p>
          </div>
          <div className="relative flex items-center gap-3">
            <Badge tone="pine">{user.role}</Badge>
            <button
              className="relative rounded-xl border border-line bg-white p-2"
              onClick={() => setOpenNotifs((v) => !v)}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] text-white">
                  {unread}
                </span>
              ) : null}
            </button>
            {openNotifs ? (
              <div className="card absolute top-12 right-0 z-30 w-80 p-2">
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
        <main className="px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
