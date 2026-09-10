export type Role = 'director' | 'teacher' | 'parent'

export type ChildStatus = 'inquiry' | 'waitlist' | 'enrolled' | 'withdrawn'
export type ApplicationStatus =
  | 'inquiry'
  | 'tour'
  | 'applied'
  | 'waitlist'
  | 'accepted'
  | 'enrolled'
  | 'declined'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partial'
export type IncidentSeverity = 'low' | 'medium' | 'high'
export type AllergySeverity = 'mild' | 'moderate' | 'severe'
export type DocStatus = 'pending' | 'approved' | 'expired'
export type AttendanceMethod = 'pin' | 'photo' | 'staff' | 'kiosk'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  avatarHue: number
  classroomIds: string[]
  childIds: string[]
  siteId: string
}

export interface Site {
  id: string
  name: string
  address: string
  phone: string
  license: string
  capacity: number
}

export interface Classroom {
  id: string
  siteId: string
  name: string
  ageGroup: string
  capacity: number
  ratioStaff: number
  ratioChildren: number
  teacherIds: string[]
  color: string
}

export interface Allergy {
  name: string
  severity: AllergySeverity
}

export interface Child {
  id: string
  firstName: string
  lastName: string
  dob: string
  gender: string
  classroomId: string
  siteId: string
  status: ChildStatus
  allergies: Allergy[]
  medicalNotes: string
  custodyNotes: string
  foodPreferences: string
  enrollmentDate: string
  parentIds: string[]
  weeklySchedule: boolean[]
  avatarHue: number
}

export interface Guardian {
  id: string
  name: string
  email: string
  phone: string
  relationship: string
  childIds: string[]
  authorizedPickup: boolean
  pin: string
}

export interface PickupPerson {
  id: string
  childId: string
  name: string
  relationship: string
  phone: string
  pin: string
  notes: string
}

export interface EmergencyContact {
  id: string
  childId: string
  name: string
  phone: string
  relationship: string
}

export interface AttendanceEvent {
  id: string
  childId: string
  date: string
  checkIn?: string
  checkOut?: string
  method: AttendanceMethod
  pickupPerson?: string
  staffId: string
  notes?: string
}

export interface HandoffEvent {
  id: string
  childId: string
  at: string
  type: 'dropoff' | 'pickup'
  personName: string
  method: AttendanceMethod
  verified: boolean
  notes: string
}

export interface MealLog {
  time: string
  type: string
  items: string
  amount: 'all' | 'most' | 'some' | 'none'
}

export interface DailyLog {
  id: string
  childId: string
  date: string
  meals: MealLog[]
  naps: { start: string; end: string }[]
  diapers: { time: string; type: 'wet' | 'dirty' | 'dry' | 'bm' }[]
  mood: string
  activities: string[]
  notes: string
  photos: number
  authorId: string
}

export interface Medication {
  id: string
  childId: string
  name: string
  dosage: string
  schedule: string
  startDate: string
  endDate: string
  parentConsent: boolean
  administrations: { at: string; staffId: string; notes: string }[]
}

export interface Vaccination {
  id: string
  childId: string
  vaccine: string
  dueDate: string
  givenDate?: string
  status: 'due' | 'complete' | 'overdue' | 'scheduled'
}

export interface Incident {
  id: string
  childId: string
  at: string
  type: string
  severity: IncidentSeverity
  description: string
  action: string
  notifiedParent: boolean
  staffId: string
}

export interface InvoiceItem {
  desc: string
  amount: number
}

export interface Invoice {
  id: string
  familyName: string
  parentId: string
  childIds: string[]
  amount: number
  paid: number
  status: InvoiceStatus
  dueDate: string
  issuedDate: string
  items: InvoiceItem[]
}

export interface StaffMember {
  id: string
  name: string
  title: string
  email: string
  phone: string
  classroomIds: string[]
  hireDate: string
  certifications: string[]
  trainingHours: number
  requiredHours: number
  status: 'active' | 'leave' | 'inactive'
  clockedIn?: string
  avatarHue: number
}

export interface Shift {
  id: string
  staffId: string
  classroomId: string
  date: string
  start: string
  end: string
}

export interface Message {
  id: string
  fromId: string
  toId?: string
  classroomId?: string
  childId?: string
  subject: string
  body: string
  at: string
  read: boolean
  kind: 'direct' | 'announcement'
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  start: string
  end: string
  type: 'event' | 'closure' | 'meeting' | 'trip' | 'holiday'
  classroomId?: string
  siteId: string
}

export interface Observation {
  id: string
  childId: string
  date: string
  domain: string
  notes: string
  nextSteps: string
  authorId: string
}

export interface MenuDay {
  id: string
  date: string
  breakfast: string
  amSnack: string
  lunch: string
  pmSnack: string
  allergens: string
}

export interface DocumentFile {
  id: string
  childId?: string
  title: string
  category: string
  status: DocStatus
  uploadedAt: string
  expiresAt?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  qty: number
  unit: string
  reorderAt: number
}

export interface Application {
  id: string
  childName: string
  dob: string
  parentName: string
  email: string
  phone: string
  desiredStart: string
  classroomId: string
  status: ApplicationStatus
  notes: string
}

export interface NotificationItem {
  id: string
  userId: string
  title: string
  body: string
  at: string
  read: boolean
  href: string
}

export interface DisciplineNote {
  id: string
  childId: string
  at: string
  note: string
  staffId: string
}

export type TaskArea = 'health' | 'meal' | 'education' | 'care' | 'safety'
export type TaskPriority = 'urgent' | 'soon' | 'watch'

export interface TeacherWorker {
  id: string
  staffId: string
  childId: string
  status: 'monitoring' | 'paused'
  lastRunAt?: string
}

export interface WorkerTask {
  id: string
  workerId: string
  childId: string
  area: TaskArea
  priority: TaskPriority
  title: string
  detail: string
  done: boolean
}

export interface WorkerReport {
  id: string
  workerId: string
  childId: string
  generatedAt: string
  summary: string
  highlights: string[]
  risks: string[]
}

export interface MealPlanDay {
  day: string
  breakfast: string
  lunch: string
  snacks: string
  notes: string
}

export interface MealPlan {
  id: string
  workerId: string
  childId: string
  generatedAt: string
  goals: string[]
  days: MealPlanDay[]
}

export interface HealthPlan {
  id: string
  workerId: string
  childId: string
  generatedAt: string
  focus: string[]
  medications: string[]
  immunizations: string[]
  monitoring: string[]
  parentActions: string[]
}

export interface EducationPlan {
  id: string
  workerId: string
  childId: string
  generatedAt: string
  domainFocus: string[]
  thisWeek: string[]
  nextSteps: string[]
  homeIdeas: string[]
}

export type ShopCategory = 'tops' | 'bottoms' | 'outerwear' | 'shoes' | 'care' | 'uniform'
export type ShopOrderStatus = 'cart' | 'placed' | 'packed' | 'delivered' | 'cancelled'

export interface ShopItem {
  id: string
  name: string
  category: ShopCategory
  minMonths: number
  maxMonths: number
  sizes: string[]
  price: number
  stock: number
  tags: string[]
  why: string
}

export interface ShopNeed {
  id: string
  label: string
  reason: string
  tags: string[]
}

export interface ShopCartLine {
  id: string
  itemId: string
  childId: string
  size: string
  qty: number
}

export interface ShopOrderLine {
  itemId: string
  name: string
  size: string
  qty: number
  price: number
  childId: string
}

export interface ShopOrder {
  id: string
  userId: string
  childIds: string[]
  lines: ShopOrderLine[]
  total: number
  status: ShopOrderStatus
  placedAt: string
  notes: string
}

export type SkillId =
  | 'language'
  | 'numeracy'
  | 'motor'
  | 'fineMotor'
  | 'social'
  | 'music'
  | 'art'
  | 'science'
  | 'focus'
  | 'leadership'

export type BmiBand = 'infant' | 'under' | 'healthy' | 'watch' | 'high'

export interface GrowthRecord {
  id: string
  childId: string
  date: string
  heightCm: number
  weightKg: number
}

export interface SkillProgress {
  childId: string
  skillId: SkillId
  level: number
  xp: number
  lastPractice?: string
}

export interface GamePlay {
  id: string
  childId: string
  gameId: string
  at: string
  minutes: number
}

export interface TrickDone {
  id: string
  childId: string
  trickId: string
  at: string
}

export interface AppState {
  users: User[]
  currentUserId: string | null
  sites: Site[]
  currentSiteId: string
  classrooms: Classroom[]
  children: Child[]
  guardians: Guardian[]
  pickups: PickupPerson[]
  emergencies: EmergencyContact[]
  attendance: AttendanceEvent[]
  handoffs: HandoffEvent[]
  dailyLogs: DailyLog[]
  medications: Medication[]
  vaccinations: Vaccination[]
  incidents: Incident[]
  invoices: Invoice[]
  staff: StaffMember[]
  shifts: Shift[]
  messages: Message[]
  events: CalendarEvent[]
  observations: Observation[]
  menus: MenuDay[]
  documents: DocumentFile[]
  inventory: InventoryItem[]
  applications: Application[]
  notifications: NotificationItem[]
  discipline: DisciplineNote[]
  teacherWorkers: TeacherWorker[]
  workerTasks: WorkerTask[]
  workerReports: WorkerReport[]
  mealPlans: MealPlan[]
  healthPlans: HealthPlan[]
  educationPlans: EducationPlan[]
  shopCatalog: ShopItem[]
  shopCart: ShopCartLine[]
  shopOrders: ShopOrder[]
  growthRecords: GrowthRecord[]
  skillProgress: SkillProgress[]
  gamePlays: GamePlay[]
  tricksDone: TrickDone[]
}
