import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { createShopCatalog } from './data/catalog'
import { createSeed } from './data/seed'
import { convertInr, holidayDate, packOf } from './data/country'
import type {
  AppState,
  Application,
  ApplicationStatus,
  AttendanceMethod,
  Child,
  CountryCode,
  DailyLog,
  Incident,
  Invoice,
  MealLog,
  Message,
  Observation,
  PayMethod,
  QcOrder,
  SkillId,
  FamilyMealLog,
  HorizonLog,
  ParentFeedProfile,
  OttAccount,
} from './types'
import { nextWebhook } from './lib/autoOrder'
import { applyWorkerRun } from './workers/engine'
import { makeAudit, prependAudit } from './lib/audit'
import { clearSession, issueSession, readSession } from './features/auth/session'
import { sanitizeForDisk, wipeCmsKeys, wipeLegacyCmsKeys, withDemoSecrets } from './lib/privacy'

const KEY = 'willow-cms-v5'

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
  if (!parsed.countryCode) {
    next = {
      ...next,
      countryCode: 'IN',
      shopPincode: seeded.shopPincode,
      shopWishlist: seeded.shopWishlist,
      transportRoutes: seeded.transportRoutes,
      sites: seeded.sites,
      invoices: seeded.invoices,
      vaccinations: seeded.vaccinations,
      menus: seeded.menus,
      events: seeded.events,
      documents: seeded.documents,
      shopCatalog: seeded.shopCatalog,
      shopCart: seeded.shopCart,
      shopOrders: seeded.shopOrders,
      classrooms: seeded.classrooms,
      children: seeded.children,
      guardians: seeded.guardians,
      pickups: seeded.pickups,
      emergencies: seeded.emergencies,
      applications: seeded.applications,
      inventory: seeded.inventory,
      notifications: seeded.notifications,
      staff: seeded.staff,
    }
  }
  const country = (next.countryCode as CountryCode) || 'IN'
  const catalogLooksOld = !next.shopCatalog?.length || next.shopCatalog.some((i) => !('brand' in i) || !('mrp' in i))
  if (catalogLooksOld) {
    next = {
      ...next,
      shopCatalog: createShopCatalog(country),
      shopCart: (next.shopCart ?? []).filter((l) => createShopCatalog(country).some((i) => i.id === l.itemId)),
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
  if (!next.transportRoutes?.length) {
    next = { ...next, transportRoutes: seeded.transportRoutes }
  }
  return {
    ...next,
    countryCode: country,
    shopPincode: next.shopPincode || seeded.shopPincode,
    shopWishlist: next.shopWishlist ?? [],
    quickOrders: next.quickOrders ?? [],
    auditLog: next.auditLog ?? [],
    familyMealLogs: next.familyMealLogs ?? [],
    horizonLogs: next.horizonLogs ?? [],
    parentFeedProfiles: next.parentFeedProfiles ?? [],
    parentFeedRatings: next.parentFeedRatings ?? [],
    ottAccounts: next.ottAccounts ?? [],
    children: next.children.map((c) => ({ ...c, interests: c.interests ?? [] })),
  }
}

function load(): AppState {
  try {
    const raw =
      localStorage.getItem(KEY) ??
      localStorage.getItem('willow-cms-v4') ??
      localStorage.getItem('willow-cms-v3') ??
      localStorage.getItem('willow-cms-v2') ??
      localStorage.getItem('willow-cms-v1')
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      wipeLegacyCmsKeys()
      if (parsed?.sites?.length && parsed?.children?.length) {
        return restoreSession(withDemoSecrets(migrate(parsed)))
      }
    }
  } catch {
    /* ignore */
  }
  return restoreSession(createSeed())
}

function restoreSession(state: AppState): AppState {
  const session = readSession()
  if (session) {
    const user = state.users.find((u) => u.id === session.sub)
    if (user) return { ...state, currentUserId: user.id, currentSiteId: user.siteId || state.currentSiteId }
  }
  return { ...state, currentUserId: null }
}

function persist(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(sanitizeForDisk(state)))
  wipeLegacyCmsKeys()
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

interface StoreApi {
  state: AppState
  login: (email: string, password: string, remember?: boolean) => string | null
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
  payInvoice: (id: string, amount: number, method?: PayMethod) => void
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
  placeShopOrder: (opts?: { notes?: string; payment?: PayMethod; pincode?: string; address?: string }) => void
  setShopOrderStatus: (id: string, status: AppState['shopOrders'][number]['status']) => void
  setCountry: (code: CountryCode) => void
  setShopPincode: (pin: string) => void
  toggleWish: (itemId: string, childId: string) => void
  recordQuickOrder: (order: QcOrder) => void
  tickQuickOrder: (id: string) => void
  logGrowth: (childId: string, heightCm: number, weightKg: number) => void
  logSharedMeal: (log: Omit<FamilyMealLog, 'id'>) => void
  practiceSkill: (childId: string, skillId: SkillId) => void
  logGame: (childId: string, gameId: string, minutes: number) => void
  completeTrick: (childId: string, trickId: string) => void
  logHorizon: (childId: string, activityId: string, skillId: SkillId, minutes: number) => void
  upsertParentFeedProfile: (profile: ParentFeedProfile) => void
  rateParentFeed: (userId: string, itemId: string, rating: 1 | -1) => void
  upsertOttAccount: (account: Omit<OttAccount, 'id'> & { id?: string }) => void
  disconnectOtt: (id: string) => void
  touchOtt: (id: string) => void
  logAudit: (action: string, details: string) => void
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
      login: (email, password, remember = true) => {
        const user = state.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        )
        if (!user) return null
        issueSession(user, { persist: remember })
        commit({
          ...state,
          currentUserId: user.id,
          currentSiteId: user.siteId,
          auditLog: prependAudit(state.auditLog, makeAudit(user.id, 'auth.login', user.email)),
        })
        return user.id
      },
      logout: () => {
        clearSession()
        commit({
          ...state,
          currentUserId: null,
          auditLog: prependAudit(state.auditLog, makeAudit(state.currentUserId, 'auth.logout', 'signed out')),
        })
      },
      setSite: (id) => commit({ ...state, currentSiteId: id }),
      resetDemo: () => {
        clearSession()
        wipeCmsKeys()
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
      payInvoice: (id, amount, method) =>
        patch((s) => ({
          ...s,
          invoices: s.invoices.map((inv) => {
            if (inv.id !== id) return inv
            const paid = Math.min(inv.amount, inv.paid + amount)
            const status = paid >= inv.amount ? 'paid' : paid > 0 ? 'partial' : inv.status
            return { ...inv, paid, status, paymentMethod: method ?? inv.paymentMethod }
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
        patch((s) => ({
          ...s,
          observations: [{ ...obs, id: uid('o') }, ...s.observations],
          auditLog: prependAudit(s.auditLog, makeAudit(s.currentUserId, 'learning.observe', obs.domain)),
        })),
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
      placeShopOrder: (opts = {}) =>
        patch((s) => {
          if (!s.shopCart.length || !s.currentUserId) return s
          const pack = packOf(s.countryCode)
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
          const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0)
          const gst = s.shopCart.reduce((n, l) => {
            const item = s.shopCatalog.find((i) => i.id === l.itemId)
            return n + Math.round((item?.price ?? 0) * l.qty * (item?.gstRate ?? 0))
          }, 0)
          const payment = opts.payment ?? (pack.cod.enabled ? 'cod' : pack.defaultPay)
          const pin = opts.pincode ?? s.shopPincode
          let codFee = 0
          if (payment === 'cod' && pack.cod.enabled) {
            if (subtotal < pack.cod.freeAbove) codFee = convertInr(pack.cod.fee, pack)
          }
          const total = subtotal + gst + codFee
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
                notes: opts.notes ?? '',
                payment,
                pincode: pin,
                address: opts.address ?? '',
                codFee,
                gst,
                coins: Math.floor(subtotal * pack.clubRate),
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
      setCountry: (code) =>
        patch((s) => {
          const pack = packOf(code)
          const year = new Date().getFullYear()
          const holidayEvents = pack.holidays.map((h) => ({
            id: `hol-${code}-${h.month}-${h.day}`,
            title: h.title,
            date: holidayDate(year, h.month, h.day),
            start: '00:00',
            end: '23:59',
            type: 'holiday' as const,
            siteId: s.currentSiteId,
          }))
          const kept = s.events.filter((e) => !e.id.startsWith('hol-'))
          return {
            ...s,
            countryCode: code,
            shopCatalog: createShopCatalog(code),
            shopCart: [],
            events: [...holidayEvents, ...kept],
            sites: s.sites.map((site) => ({ ...site, country: code })),
          }
        }),
      setShopPincode: (pin) => patch((s) => ({ ...s, shopPincode: pin })),
      toggleWish: (itemId, childId) =>
        patch((s) => {
          const list = s.shopWishlist ?? []
          const exists = list.some((w) => w.itemId === itemId && w.childId === childId)
          return {
            ...s,
            shopWishlist: exists
              ? list.filter((w) => !(w.itemId === itemId && w.childId === childId))
              : [...list, { itemId, childId }],
          }
        }),
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
      logSharedMeal: (log) =>
        patch((s) => {
          const entry: FamilyMealLog = { ...log, id: uid('fm') }
          let next = {
            ...s,
            familyMealLogs: [entry, ...(s.familyMealLogs ?? [])],
          }
          const amount = log.childIds.length > 1 ? 'most' : 'all'
          for (const childId of log.childIds) {
            const meal: MealLog = {
              time: new Date().toTimeString().slice(0, 5),
              type: log.slot,
              items: log.recipeName,
              amount,
            }
            const existing = next.dailyLogs.find((d) => d.childId === childId && d.date === log.date)
            if (!existing) {
              next = {
                ...next,
                dailyLogs: [
                  {
                    id: uid('d'),
                    childId,
                    date: log.date,
                    meals: [meal],
                    naps: [],
                    diapers: [],
                    mood: '',
                    activities: [],
                    notes: log.note ?? '',
                    photos: log.source === 'photo' ? 1 : 0,
                    authorId: next.currentUserId ?? 's-jordan',
                  },
                  ...next.dailyLogs,
                ],
              }
            } else {
              next = {
                ...next,
                dailyLogs: next.dailyLogs.map((d) =>
                  d.id === existing.id ? { ...d, meals: [...d.meals, meal] } : d,
                ),
              }
            }
          }
          return next
        }),
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
      logHorizon: (childId, activityId, skillId, minutes) =>
        patch((s) => {
          const now = new Date().toISOString()
          const log: HorizonLog = { id: uid('hz'), childId, activityId, skillId, at: now, minutes }
          const list = s.skillProgress ?? []
          const existing = list.find((p) => p.childId === childId && p.skillId === skillId)
          const skillProgress = existing
            ? list.map((p) => {
                if (p.childId !== childId || p.skillId !== skillId) return p
                const xp = p.xp + 15
                return { ...p, xp, level: Math.min(5, 1 + Math.floor(xp / 50)), lastPractice: now }
              })
            : [{ childId, skillId, level: 1, xp: 15, lastPractice: now }, ...list]
          return {
            ...s,
            horizonLogs: [log, ...(s.horizonLogs ?? [])],
            skillProgress,
          }
        }),
      upsertParentFeedProfile: (profile) =>
        patch((s) => {
          const list = s.parentFeedProfiles ?? []
          const exists = list.some((p) => p.userId === profile.userId)
          return {
            ...s,
            parentFeedProfiles: exists
              ? list.map((p) => (p.userId === profile.userId ? profile : p))
              : [profile, ...list],
          }
        }),
      rateParentFeed: (userId, itemId, rating) =>
        patch((s) => ({
          ...s,
          parentFeedRatings: [
            ...(s.parentFeedRatings ?? []).filter((r) => !(r.userId === userId && r.itemId === itemId)),
            { userId, itemId, rating, at: new Date().toISOString(), id: uid('pfr') },
          ],
        })),
      upsertOttAccount: (account) =>
        patch((s) => {
          const id = account.id ?? uid('ott')
          const row: OttAccount = { ...account, id, connected: true }
          const list = s.ottAccounts ?? []
          const idx = list.findIndex((a) => a.id === id || (a.userId === row.userId && a.platformId === row.platformId))
          const ottAccounts = idx >= 0 ? list.map((a, i) => (i === idx ? { ...a, ...row, id: a.id } : a)) : [...list, row]
          return { ...s, ottAccounts }
        }),
      disconnectOtt: (id) => patch((s) => ({ ...s, ottAccounts: (s.ottAccounts ?? []).filter((a) => a.id !== id) })),
      touchOtt: (id) =>
        patch((s) => ({
          ...s,
          ottAccounts: (s.ottAccounts ?? []).map((a) => (a.id === id ? { ...a, lastOpenedAt: new Date().toISOString() } : a)),
        })),
      logAudit: (action, details) =>
        patch((s) => ({
          ...s,
          auditLog: prependAudit(s.auditLog, makeAudit(s.currentUserId, action, details)),
        })),
      recordQuickOrder: (order) =>
        patch((s) => ({
          ...s,
          quickOrders: [order, ...(s.quickOrders ?? [])],
          notifications: [
            {
              id: uid('n'),
              userId: s.currentUserId ?? order.userId,
              title: `${order.appName} auto-order ${order.id}`,
              body: `${order.lines.length} SKUs · ${order.payment.toUpperCase()} · ~${order.etaMin} min (sandbox)`,
              at: new Date().toISOString(),
              read: false,
              href: '/shop',
            },
            ...s.notifications,
          ],
        })),
      tickQuickOrder: (id) =>
        patch((s) => ({
          ...s,
          quickOrders: (s.quickOrders ?? []).map((o) => (o.id === id ? nextWebhook(o) : o)),
        })),
    }
  }, [state])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Store missing')
  return ctx
}
