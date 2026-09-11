export const PAGE_LOADERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/Dashboard'),
  '/grow': () => import('../pages/Grow'),
  '/children': () => import('../pages/Children'),
  '/workers': () => import('../pages/Workers'),
  '/enrollment': () => import('../pages/Enrollment'),
  '/attendance': () => import('../pages/Attendance'),
  '/daily-care': () => import('../pages/DailyCare'),
  '/health': () => import('../pages/Health'),
  '/billing': () => import('../pages/Billing'),
  '/staff': () => import('../pages/Staff'),
  '/classrooms': () => import('../pages/Classrooms'),
  '/messages': () => import('../pages/Messages'),
  '/calendar': () => import('../pages/Calendar'),
  '/learning': () => import('../pages/Learning'),
  '/meals': () => import('../pages/Meals'),
  '/shop': () => import('../pages/Shop'),
  '/transport': () => import('../pages/Transport'),
  '/documents': () => import('../pages/Documents'),
  '/inventory': () => import('../pages/Inventory'),
  '/reports': () => import('../pages/Reports'),
  '/settings': () => import('../pages/Settings'),
}

export function prefetchRoute(to: string) {
  void PAGE_LOADERS[to]?.()
}
