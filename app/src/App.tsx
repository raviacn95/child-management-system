import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Attendance } from './pages/Attendance'
import { Billing } from './pages/Billing'
import { CalendarPage } from './pages/Calendar'
import { ChildrenPage } from './pages/Children'
import { Classrooms } from './pages/Classrooms'
import { DailyCare } from './pages/DailyCare'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { Enrollment } from './pages/Enrollment'
import { Grow } from './pages/Grow'
import { Health } from './pages/Health'
import { Inventory } from './pages/Inventory'
import { Learning } from './pages/Learning'
import { Login } from './pages/Login'
import { Meals } from './pages/Meals'
import { Messages } from './pages/Messages'
import { Reports } from './pages/Reports'
import { SettingsPage } from './pages/Settings'
import { Shop } from './pages/Shop'
import { StaffPage } from './pages/Staff'
import { Workers } from './pages/Workers'
import { StoreProvider, useStore } from './store'

function Guard({ children }: { children: ReactNode }) {
  const { state } = useStore()
  if (!state.currentUserId) return <Navigate to="/login" replace />
  return children
}

function Guest({ children }: { children: ReactNode }) {
  const { state } = useStore()
  if (state.currentUserId) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <Login />
          </Guest>
        }
      />
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
        <Route path="/meals" element={<Meals />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  )
}
