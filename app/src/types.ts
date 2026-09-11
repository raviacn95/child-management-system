export type Role = 'director' | 'teacher' | 'parent'
export type AgeBand = '2-5' | '5-8' | '8-12'
export type LearningInterest =
  | 'animals'
  | 'art'
  | 'math'
  | 'music'
  | 'science'
  | 'stories'
  | 'movement'
  | 'space'
  | 'history'

export interface LearningChannel {
  id: string
  name: string
  handle?: string
  ageBands: AgeBand[]
  interests: LearningInterest[]
  description: string
  youtubeUrl: string
  playlistUrl?: string
  youtubeKids: boolean
  adLight: boolean
  autoplaySafe: boolean
  coViewingTip: string
}

export interface RankedChannel extends LearningChannel {
  score: number
  reasons: string[]
}

export interface RecommendationOutput {
  ageBand: AgeBand
  childName?: string
  channels: RankedChannel[]
  playlist: { channelId: string; url: string }[]
  safeguards: string[]
  anekalTip?: string
}

export interface AuditEntry {
  id: string
  at: string
  userId: string | null
  action: string
  details: string
}

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

export type CountryCode = 'IN' | 'US' | 'AE' | 'SG' | 'GB'
export type PayMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash' | 'neft' | 'cheque'

export interface Site {
  id: string
  name: string
  address: string
  phone: string
  license: string
  capacity: number
  country?: CountryCode
  state?: string
  pincode?: string
  gstin?: string
  udise?: string
  affiliation?: string
  fssai?: string
  whatsapp?: string
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
  bloodGroup?: string
  motherTongue?: string
  religion?: string
  category?: string
  idLast4?: string
  nationality?: string
  transportRouteId?: string
  tiffin?: boolean
  stage?: string
  dietType?: string
  interests?: LearningInterest[]
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
  gstRate?: number
  gstAmount?: number
  paymentMethod?: PayMethod
  upiRef?: string
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
  kind: 'direct' | 'announcement' | 'whatsapp'
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

export type ShopCategory =
  | 'fashion'
  | 'footwear'
  | 'diapering'
  | 'feeding'
  | 'bath'
  | 'toys'
  | 'gear'
  | 'nursery'
  | 'school'
  | 'books'
  | 'moms'
  | 'uniform'
export type ShopOrderStatus = 'cart' | 'placed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'

export interface ShopItem {
  id: string
  name: string
  brand: string
  category: ShopCategory
  minMonths: number
  maxMonths: number
  sizes: string[]
  mrp: number
  price: number
  stock: number
  tags: string[]
  why: string
  emoji: string
  rating: number
  sold: number
  codOk: boolean
  gstRate: number
  comboWith: string[]
  deliveryDays: number
  badge?: string
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
  payment?: PayMethod
  pincode?: string
  address?: string
  codFee?: number
  gst?: number
  coins?: number
}

export interface TransportRoute {
  id: string
  siteId: string
  name: string
  vehicle: string
  attendant: string
  am: string
  pm: string
  stops: string[]
  fee: number
  seats: number
  occupied: number
}

export interface ShopWish {
  itemId: string
  childId: string
}

export type QcAppId = 'zepto' | 'blinkit' | 'instamart'
export type QcOrderStatus = 'quoted' | 'confirmed' | 'packed' | 'rider' | 'delivered' | 'cancelled'

export interface QcOffer {
  app: QcAppId
  sku: string
  name: string
  brand: string
  price: number
  mrp: number
  etaMin: number
  stock: number
  codOk: boolean
  veg: boolean
  allergens: string[]
}

export interface QcLinePick {
  needId: string
  label: string
  chosen: QcOffer
  runners: QcOffer[]
  score: number
  reason: string
}

export interface QcDecision {
  app: QcAppId
  appName: string
  etaMin: number
  subtotal: number
  allCod: boolean
  why: string
}

export interface QcQuote {
  picks: QcLinePick[]
  comparison: QcOffer[]
  decision: QcDecision
  mode: 'sandbox' | 'middleware'
}

export interface QcWebhookEvent {
  at: string
  status: QcOrderStatus
  note: string
}

export interface QcOrderLine {
  sku: string
  name: string
  needId: string
  price: number
  app: QcAppId
}

export interface QcOrder {
  id: string
  childId: string
  userId: string
  app: QcAppId
  appName: string
  status: QcOrderStatus
  payment: PayMethod
  pincode: string
  address: string
  lines: QcOrderLine[]
  total: number
  etaMin: number
  placedAt: string
  mode: 'sandbox' | 'middleware'
  events: QcWebhookEvent[]
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

export type FamilyMealSource = 'shared' | 'photo' | 'chat'

export interface FamilyMealLog {
  id: string
  date: string
  recipeId: string
  recipeName: string
  slot: 'breakfast' | 'lunch' | 'snack' | 'dinner'
  childIds: string[]
  source: FamilyMealSource
  note?: string
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

export interface HorizonLog {
  id: string
  childId: string
  activityId: string
  skillId: SkillId
  at: string
  minutes: number
}

export type ParentCategory = 'movies' | 'learning' | 'parenting' | 'finance' | 'health'
export type ParentGoal = 'wealth' | 'parenting' | 'learning' | 'health' | 'career'
export type ParentTimeMode = 'short' | 'long' | 'mixed'
export type ParentLang = 'en' | 'hi'

export interface ParentFeedProfile {
  userId: string
  ageYears: number
  interests: ParentCategory[]
  goals: ParentGoal[]
  timeMode: ParentTimeMode
  languages: ParentLang[]
}

export interface ParentFeedRating {
  id: string
  userId: string
  itemId: string
  rating: 1 | -1
  at: string
}

export interface OttAccount {
  id: string
  userId: string
  platformId: string
  email: string
  connected: boolean
  lastOpenedAt?: string
}

export interface AppState {
  countryCode: CountryCode
  shopPincode: string
  shopWishlist: ShopWish[]
  transportRoutes: TransportRoute[]
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
  quickOrders: QcOrder[]
  growthRecords: GrowthRecord[]
  familyMealLogs: FamilyMealLog[]
  skillProgress: SkillProgress[]
  gamePlays: GamePlay[]
  tricksDone: TrickDone[]
  horizonLogs: HorizonLog[]
  parentFeedProfiles: ParentFeedProfile[]
  parentFeedRatings: ParentFeedRating[]
  ottAccounts: OttAccount[]
  auditLog: AuditEntry[]
}
