import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { createShopCatalog } from './data/catalog'
import { createSeed } from './data/seed'
import type {
  AppState,
  Application,
  ApplicationStatus,
  AttendanceMethod,
  Child,
  DailyLog,
  Incident,
  Invoice,
  MealLog,
  Message,
  Observation,
  SkillId,
} from './types'
import { applyWorkerRun } from './workers/engine'

const KEY = 'willow-cms-v4'

function migrate(parsed: AppState): AppState {
  const seeded = createSeed()
  let next = parsed
  if (!(parsed.teacherWorkers?.length === 5 && parsed.mealPlans?.length)) {
    const staffIds = new Set(parsed.staff.map((s) => s.id))
    next = applyWorkerRun({
      ...parsed,
      staff: [...parsed.staff, ...seeded.staff.filter((s) => !staffIds.has(s.id))],
      teacherWorkers: seeded.teacherWorkers,
      workerTasks: parsed.workerTasks ?? [],
      workerReports: parsed.workerReports ?? [],
      mealPlans: parsed.mealPlans ?? [],
      healthPlans: parsed.healthPlans ?? [],
      educationPlans: parsed.educationPlans ?? [],
    })
  }
  if (!next.shopCatalog?.length) {
    next = {
      ...next,
      shopCatalog: createShopCatalog(),
      shopCart: next.shopCart ?? [],
      shopOrders: next.shopOrders ?? seeded.shopOrders,
    }
  }
  if (!next.growthRecords?.length) {
    next = {
      ...next,
      growthRecords: seeded.growthRecords,
      skillProgress: next.skillProgress?.length ? next.skillProgress : seeded.skillProgress,
      gamePlays: next.gamePlays ?? [],
      tricksDone: next.tricksDone ?? [],
    }
  }
  return next
}

function load(): AppState {
  try {
    const raw =
      localStorage.getItem(KEY) ??
      localStorage.getItem('willow-cms-v3') ??
      localStorage.getItem('willow-cms-v2') ??
      localStorage.getItem('willow-cms-v1')
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed?.sites?.length && parsed?.children?.length) return migrate(parsed)
    }
  } catch {
    /* ignore */
  }
  return createSeed()
}

function persist(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

interface StoreApi {
  state: AppState
  login: (email: string, password: string) => string | null
  logout: () => void
  setSite: (id: string) => void
  resetDemo: () => void
  checkIn: (childId: string, method: AttendanceMethod, person: string) => void
  checkOut: (childId: string, person: string) => void
  addChild: (child: Omit<Child, 'id' | 'avatarHue'>) => void
  updateChild: (id: string, patch: Partial<Child>) => void
  addDailyLog: (log: Omit<DailyLog, 'id'>) => void
  addMeal: (childId: string, date: string, meal: MealLog) => void
  addIncident: (incident: Omit<Incident, 'id'>) => void
  administerMed: (medId: string, staffId: string, notes: string) => void
  markVaccineGiven: (id: string) => void
  sendMessage: (msg: Omit<Message, 'id' | 'at' | 'read'>) => void
  markMessageRead: (id: string) => void
  payInvoice: (id: string, amount: number) => void
  addInvoice: (inv: Omit<Invoice, 'id'>) => void
  updateApplication: (id: string, status: ApplicationStatus) => void
  addApplication: (app: Omit<Application, 'id'>) => void
  clockToggle: (staffId: string) => void
  addObservation: (obs: Omit<Observation, 'id'>) => void
  markNotifRead: (id: string) => void
  adjustInventory: (id: string, delta: number) => void
  approveDocument: (id: string) => void
  addEvent: (title: string, date: string, type: AppState['events'][number]['type']) => void
  runWorkers: () => void
  completeWorkerTask: (id: string, done?: boolean) => void
  addToCart: (itemId: string, childId: string, size: string, qty?: number) => void
  setCartQty: (id: string, qty: number) => void
  placeShopOrder: (notes?: string) => void
  setShopOrderStatus: (id: string, status: AppState['shopOrders'][number]['status']) => void
  logGrowth: (childId: string, heightCm: number, weightKg: number) => void
  practiceSkill: (childId: string, skillId: SkillId) => void
  logGame: (childId: string, gameId: string, minutes: number) => void
  completeTrick: (childId: string, trickId: string) => void
}

const Ctx = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)

  const commit = (next: AppState) => {
    persist(next)
    setState(next)
  }

  const api = useMemo<StoreApi>(() => {
    const patch = (fn: (s: AppState) => AppState) => commit(fn(state))

    return {
      state,
      login: (email, password) => {
        const user = state.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        )
        if (!user) return null
        commit({ ...state, currentUserId: user.id, currentSiteId: user.siteId })
        return user.id
      },
      logout: () => commit({ ...state, currentUserId: null }),
      setSite: (id) => commit({ ...state, currentSiteId: id }),
      resetDemo: () => {
        localStorage.removeItem(KEY)
        commit(createSeed())
      },
      checkIn: (childId, method, person) => {
        const date = new Date().toISOString().slice(0, 10)
        const time = new Date().toTimeString().slice(0, 5)
        const user = state.users.find((u) => u.id === state.currentUserId)
        const staffId = user?.role === 'teacher' ? 's-jordan' : 's-maya'
        const existing = state.attendance.find((a) => a.childId === childId && a.date === date)
        const attendance = existing
          ? state.attendance.map((a) =>
              a.id === existing.id ? { ...a, checkIn: a.checkIn ?? time, method, pickupPerson: person } : a,
            )
          : [
              ...state.attendance,
              {
                id: uid('att'),
                childId,
                date,
                checkIn: time,
                method,
                pickupPerson: person,
                staffId,
              },
            ]
        commit({
          ...state,
          attendance,
          handoffs: [
            {
              id: uid('h'),
              childId,
              at: new Date().toISOString(),
              type: 'dropoff',
              personName: person,
              method,
              verified: true,
              notes: `${method} check-in`,
            },
            ...state.handoffs,
          ],
        })
      },
      checkOut: (childId, person) => {
        const date = new Date().toISOString().slice(0, 10)
        const time = new Date().toTimeString().slice(0, 5)
        commit({
          ...state,
          attendance: state.attendance.map((a) =>
            a.childId === childId && a.date === date ? { ...a, checkOut: time, pickupPerson: person } : a,
          ),
          handoffs: [
            {
              id: uid('h'),
              childId,
              at: new Date().toISOString(),
              type: 'pickup',
              personName: person,
              method: 'staff',
              verified: true,
              notes: 'Staff-verified pickup',
            },
            ...state.handoffs,
          ],
        })
      },
      addChild: (child) =>
        patch((s) => ({
          ...s,
          children: [{ ...child, id: uid('c'), avatarHue: Math.floor(Math.random() * 360) }, ...s.children],
        })),
      updateChild: (id, next) =>
        patch((s) => ({
          ...s,
          children: s.children.map((c) => (c.id === id ? { ...c, ...next } : c)),
        })),
      addDailyLog: (log) => patch((s) => ({ ...s, dailyLogs: [{ ...log, id: uid('d') }, ...s.dailyLogs] })),
      addMeal: (childId, date, meal) =>
        patch((s) => {
          const existing = s.dailyLogs.find((d) => d.childId === childId && d.date === date)
          if (!existing) {
            return {
              ...s,
              dailyLogs: [
                {
                  id: uid('d'),
                  childId,
                  date,
                  meals: [meal],
                  naps: [],
                  diapers: [],
                  mood: '',
                  activities: [],
                  notes: '',
                  photos: 0,
                  authorId: s.currentUserId ?? 's-jordan',
                },
                ...s.dailyLogs,
              ],
            }
          }
          return {
            ...s,
            dailyLogs: s.dailyLogs.map((d) =>
              d.id === existing.id ? { ...d, meals: [...d.meals, meal] } : d,
            ),
          }
        }),
      addIncident: (incident) =>
        patch((s) => ({ ...s, incidents: [{ ...incident, id: uid('i') }, ...s.incidents] })),
      administerMed: (medId, staffId, notes) =>
        patch((s) => ({
          ...s,
          medications: s.medications.map((m) =>
            m.id === medId
              ? {
                  ...m,
                  administrations: [
                    ...m.administrations,
                    { at: new Date().toISOString(), staffId, notes },
                  ],
                }
              : m,
          ),
        })),
      markVaccineGiven: (id) =>
        patch((s) => ({
          ...s,
          vaccinations: s.vaccinations.map((v) =>
            v.id === id
              ? { ...v, status: 'complete', givenDate: new Date().toISOString().slice(0, 10) }
              : v,
          ),
        })),
      sendMessage: (msg) =>
        patch((s) => ({
          ...s,
          messages: [
            { ...msg, id: uid('msg'), at: new Date().toISOString(), read: false },
            ...s.messages,
          ],
        })),
      markMessageRead: (id) =>
        patch((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
        })),
      payInvoice: (id, amount) =>
        patch((s) => ({
          ...s,
          invoices: s.invoices.map((inv) => {
            if (inv.id !== id) return inv
            const paid = Math.min(inv.amount, inv.paid + amount)
            const status = paid >= inv.amount ? 'paid' : paid > 0 ? 'partial' : inv.status
            return { ...inv, paid, status }
          }),
        })),
      addInvoice: (inv) =>
        patch((s) => ({
          ...s,
          invoices: [{ ...inv, id: `INV-${Math.floor(1000 + Math.random() * 9000)}` }, ...s.invoices],
        })),
      updateApplication: (id, status) =>
        patch((s) => ({
          ...s,
          applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      addApplication: (app) =>
        patch((s) => ({ ...s, applications: [{ ...app, id: uid('app') }, ...s.applications] })),
      clockToggle: (staffId) =>
        patch((s) => ({
          ...s,
          staff: s.staff.map((st) =>
            st.id === staffId
              ? { ...st, clockedIn: st.clockedIn ? undefined : new Date().toTimeString().slice(0, 5) }
              : st,
          ),
        })),
      addObservation: (obs) =>
        patch((s) => ({ ...s, observations: [{ ...obs, id: uid('o') }, ...s.observations] })),
      markNotifRead: (id) =>
        patch((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      adjustInventory: (id, delta) =>
        patch((s) => ({
          ...s,
          inventory: s.inventory.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)),
        })),
      approveDocument: (id) =>
        patch((s) => ({
          ...s,
          documents: s.documents.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)),
        })),
      addEvent: (title, date, type) =>
        patch((s) => ({
          ...s,
          events: [
            {
              id: uid('ev'),
              title,
              date,
              start: '09:00',
              end: '10:00',
              type,
              siteId: s.currentSiteId,
            },
            ...s.events,
          ],
        })),
      runWorkers: () => patch((s) => applyWorkerRun(s)),
      completeWorkerTask: (id, done = true) =>
        patch((s) => ({
          ...s,
          workerTasks: s.workerTasks.map((t) => (t.id === id ? { ...t, done } : t)),
        })),
      addToCart: (itemId, childId, size, qty = 1) =>
        patch((s) => {
          const existing = s.shopCart.find((l) => l.itemId === itemId && l.childId === childId && l.size === size)
          if (existing) {
            return {
              ...s,
              shopCart: s.shopCart.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + qty } : l)),
            }
          }
          return {
            ...s,
            shopCart: [...s.shopCart, { id: uid('cart'), itemId, childId, size, qty }],
          }
        }),
      setCartQty: (id, qty) =>
        patch((s) => ({
          ...s,
          shopCart: qty <= 0 ? s.shopCart.filter((l) => l.id !== id) : s.shopCart.map((l) => (l.id === id ? { ...l, qty } : l)),
        })),
      placeShopOrder: (notes = '') =>
        patch((s) => {
          if (!s.shopCart.length || !s.currentUserId) return s
          const lines = s.shopCart.map((l) => {
            const item = s.shopCatalog.find((i) => i.id === l.itemId)
            return {
              itemId: l.itemId,
              name: item?.name ?? l.itemId,
              size: l.size,
              qty: l.qty,
              price: item?.price ?? 0,
              childId: l.childId,
            }
          })
          const total = lines.reduce((n, l) => n + l.price * l.qty, 0)
          const stocked = s.shopCatalog.map((item) => {
            const used = lines.filter((l) => l.itemId === item.id).reduce((n, l) => n + l.qty, 0)
            return { ...item, stock: Math.max(0, item.stock - used) }
          })
          return {
            ...s,
            shopCatalog: stocked,
            shopCart: [],
            shopOrders: [
              {
                id: `SO-${Math.floor(2200 + Math.random() * 700)}`,
                userId: s.currentUserId,
                childIds: [...new Set(lines.map((l) => l.childId))],
                lines,
                total,
                status: 'placed',
                placedAt: new Date().toISOString(),
                notes,
              },
              ...s.shopOrders,
            ],
          }
        }),
      setShopOrderStatus: (id, status) =>
        patch((s) => ({
          ...s,
          shopOrders: s.shopOrders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
      logGrowth: (childId, heightCm, weightKg) =>
        patch((s) => ({
          ...s,
          growthRecords: [
            {
              id: uid('gr'),
              childId,
              date: new Date().toISOString().slice(0, 10),
              heightCm,
              weightKg,
            },
            ...s.growthRecords,
          ],
        })),
      practiceSkill: (childId, skillId: SkillId) =>
        patch((s) => {
          const list = s.skillProgress ?? []
          const existing = list.find((p) => p.childId === childId && p.skillId === skillId)
          const now = new Date().toISOString()
          if (!existing) {
            return {
              ...s,
              skillProgress: [{ childId, skillId, level: 1, xp: 15, lastPractice: now }, ...list],
            }
          }
          const xp = existing.xp + 15
          const level = Math.min(5, 1 + Math.floor(xp / 50))
          return {
            ...s,
            skillProgress: list.map((p) =>
              p.childId === childId && p.skillId === skillId ? { ...p, xp, level, lastPractice: now } : p,
            ),
          }
        }),
      logGame: (childId, gameId, minutes) =>
        patch((s) => ({
          ...s,
          gamePlays: [
            { id: uid('gp'), childId, gameId, at: new Date().toISOString(), minutes },
            ...(s.gamePlays ?? []),
          ],
        })),
      completeTrick: (childId, trickId) =>
        patch((s) => {
          const already = (s.tricksDone ?? []).some((t) => t.childId === childId && t.trickId === trickId)
          if (already) return s
          return {
            ...s,
            tricksDone: [{ id: uid('tr'), childId, trickId, at: new Date().toISOString() }, ...(s.tricksDone ?? [])],
          }
        }),
    }
  }, [state])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Store missing')
  return ctx
}
