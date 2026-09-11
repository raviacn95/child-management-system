import { useEffect, type ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { PageFallback } from './components/PageFallback'
import { moduleFromPath, canSee } from './lib/rbac'
import { applyTvMode, homePath } from './lib/tv'
import { markBootSuccess } from './lib/releaseGuard'
import { InstallProvider } from './features/install/InstallProvider'
import { StoreProvider, useStore } from './store'
import { ThemeProvider } from './theme/ThemeProvider'

const Attendance = lazy(() => import('./pages/Attendance').then((m) => ({ default: m.Attendance })))
const Billing = lazy(() => import('./pages/Billing').then((m) => ({ default: m.Billing })))
const CalendarPage = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.CalendarPage })))
const ChildrenPage = lazy(() => import('./pages/Children').then((m) => ({ default: m.ChildrenPage })))
const Classrooms = lazy(() => import('./pages/Classrooms').then((m) => ({ default: m.Classrooms })))
const DailyCare = lazy(() => import('./pages/DailyCare').then((m) => ({ default: m.DailyCare })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Documents = lazy(() => import('./pages/Documents').then((m) => ({ default: m.Documents })))
const Enrollment = lazy(() => import('./pages/Enrollment').then((m) => ({ default: m.Enrollment })))
const Grow = lazy(() => import('./pages/Grow').then((m) => ({ default: m.Grow })))
const Health = lazy(() => import('./pages/Health').then((m) => ({ default: m.Health })))
const Inventory = lazy(() => import('./pages/Inventory').then((m) => ({ default: m.Inventory })))
const Learning = lazy(() => import('./pages/Learning').then((m) => ({ default: m.Learning })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const GetApp = lazy(() => import('./pages/GetApp').then((m) => ({ default: m.GetApp })))
const ParentFeedPage = lazy(() => import('./pages/ParentFeed').then((m) => ({ default: m.ParentFeedPage })))
const MoviesPage = lazy(() => import('./pages/Movies').then((m) => ({ default: m.MoviesPage })))
const TvHome = lazy(() => import('./pages/TvHome').then((m) => ({ default: m.TvHome })))
const OttPage = lazy(() => import('./pages/Ott').then((m) => ({ default: m.OttPage })))
const EroticPage = lazy(() => import('./pages/Erotic').then((m) => ({ default: m.EroticPage })))
const Meals = lazy(() => import('./pages/Meals').then((m) => ({ default: m.Meals })))
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })))
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })))
const TransportPage = lazy(() => import('./pages/Transport').then((m) => ({ default: m.TransportPage })))
const StaffPage = lazy(() => import('./pages/Staff').then((m) => ({ default: m.StaffPage })))
const Workers = lazy(() => import('./pages/Workers').then((m) => ({ default: m.Workers })))

function Guard({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const location = useLocation()
  const user = state.users.find((u) => u.id === state.currentUserId)
  if (!user) return <Navigate to="/login" replace />
  const key = moduleFromPath(location.pathname)
  if (key && !canSee(user.role, key)) return <Navigate to="/" replace />
  return children
}

function Guest({ children }: { children: ReactNode }) {
  const { state } = useStore()
  if (state.currentUserId) return <Navigate to={homePath()} replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <Guest>
              <Login />
            </Guest>
          }
        />
        <Route path="/get-app" element={<GetApp />} />
        <Route
          element={
            <Guard>
              <Layout />
            </Guard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/grow" element={<Grow />} />
          <Route path="/children" element={<ChildrenPage />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/daily-care" element={<DailyCare />} />
          <Route path="/health" element={<Health />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/classrooms" element={<Classrooms />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/parent-feed" element={<ParentFeedPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/tv" element={<TvHome />} />
          <Route path="/ott" element={<OttPage />} />
          <Route path="/erotic" element={<EroticPage />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  useEffect(() => {
    applyTvMode()
    markBootSuccess()
  }, [])
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <StoreProvider>
            <InstallProvider>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </InstallProvider>
          </StoreProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
