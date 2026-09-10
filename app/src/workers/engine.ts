import type {
  AppState,
  Child,
  EducationPlan,
  HealthPlan,
  MealPlan,
  TeacherWorker,
  WorkerReport,
  WorkerTask,
} from '../types'

function isoNow() {
  return new Date().toISOString()
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function childName(c: Child) {
  return `${c.firstName} ${c.lastName}`
}

function ageLabel(dob: string) {
  const d = new Date(dob)
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1
  if (years < 1) {
    const months = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    return `${Math.max(months, 0)} months`
  }
  return `${years} years`
}

function weekdayNames() {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
}

function avoidList(child: Child) {
  const bits = [
    ...child.allergies.map((a) => a.name.toLowerCase()),
    child.foodPreferences.toLowerCase(),
  ].join(' ')
  return {
    peanut: bits.includes('peanut'),
    egg: bits.includes('egg'),
    dairy: bits.includes('dairy') || bits.includes('lactose'),
    strawberry: bits.includes('strawber'),
    vegetarian: bits.includes('vegetarian'),
    infant: bits.includes('formula') || bits.includes('breast'),
  }
}

function mealFor(child: Child, dayIndex: number): MealPlan['days'][number] {
  const a = avoidList(child)
  const day = weekdayNames()[dayIndex]
  if (a.infant) {
    const bottles = [
      { breakfast: '4 oz breastmilk', lunch: '5 oz formula + rice cereal', snacks: '2 oz breastmilk' },
      { breakfast: '4 oz formula', lunch: '5 oz breastmilk + avocado smear', snacks: '3 oz formula' },
      { breakfast: '4 oz breastmilk', lunch: 'Pureed carrot + 4 oz formula', snacks: '2 oz breastmilk' },
      { breakfast: '4 oz formula', lunch: '5 oz breastmilk + oat cereal', snacks: 'Banana smear (if started)' },
      { breakfast: '4 oz breastmilk', lunch: '5 oz formula, hold upright 15 min', snacks: '2 oz formula' },
    ][dayIndex]
    return { day, ...bottles, notes: child.medicalNotes || 'Follow infant feeding plan. No cow dairy yet.' }
  }
  const breakfasts = a.dairy
    ? ['Oatmeal + blueberries + oat milk', 'Banana pancakes (oat milk)', 'Toast + sunflower butter + fruit', 'Rice porridge + pear', 'Oat waffle + berries']
    : a.egg
      ? ['Oatmeal + blueberries', 'Yogurt + granola (egg-free)', 'Toast + sunflower butter', 'Fruit cup + milk', 'Overnight oats']
      : ['Oatmeal + blueberries + milk', 'Yogurt parfait', 'Scrambled egg + toast', 'Banana + whole grain waffle', 'Cheese toast + fruit']
  const lunches = a.vegetarian
    ? ['Lentil rice + carrots', 'Chickpea quinoa + beans', 'Tofu stir veg + rice', 'Black bean taco cups', 'Sweet potato + hummus']
    : a.peanut
      ? ['Lentil rice + carrots (nut-free kitchen)', 'Chicken + quinoa + green beans', 'Turkey meatballs + pasta', 'Fish + rice + cucumber', 'Beef + sweet potato']
      : a.egg
        ? ['Chicken + rice + carrots (no egg wash)', 'Lentil stew + bread', 'Turkey + quinoa', 'Bean chili + rice', 'Fish + potato']
        : ['Chicken + quinoa + beans', 'Lentil rice + carrots', 'Turkey + pasta', 'Fish + rice', 'Beef + veg']
  const snacks = a.strawberry
    ? ['Apple + crackers', 'Cucumber + hummus', 'Pear + pretzels', 'Cheese + grapes', 'Orange + oat bar']
    : a.dairy
      ? ['Apple + crackers', 'Hummus + cucumber', 'Pear + pretzels', 'Sunflower butter + celery', 'Orange wedges']
      : ['Apple + cheese', 'Yogurt + berries', 'Crackers + hummus', 'Banana', 'Cheese stick + cucumber']
  const notes = [
    child.allergies.length ? `Allergens to exclude: ${child.allergies.map((x) => x.name).join(', ')}.` : 'No allergy exclusions.',
    child.foodPreferences || '',
    a.peanut ? 'Serve only from nut-free prep table. EpiPen in room kit.' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return {
    day,
    breakfast: breakfasts[dayIndex],
    lunch: lunches[dayIndex],
    snacks: snacks[dayIndex],
    notes,
  }
}

function buildTasks(state: AppState, worker: TeacherWorker, child: Child): WorkerTask[] {
  const t = todayStr()
  const tasks: WorkerTask[] = []
  const add = (partial: Omit<WorkerTask, 'id' | 'workerId' | 'childId' | 'done'>) => {
    tasks.push({
      id: `${worker.id}-${partial.area}-${partial.title.slice(0, 24).replace(/\s+/g, '-').toLowerCase()}`,
      workerId: worker.id,
      childId: child.id,
      done: false,
      ...partial,
    })
  }

  const att = state.attendance.find((a) => a.childId === child.id && a.date === t)
  const expectedToday = child.weeklySchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  if (expectedToday && !att?.checkIn) {
    add({
      area: 'care',
      priority: 'soon',
      title: 'Expected, not yet in',
      detail: `${childName(child)} is scheduled today and has not checked in. Confirm absence with family.`,
    })
  }

  const log = state.dailyLogs.find((d) => d.childId === child.id && d.date === t)
  if (!log) {
    add({
      area: 'care',
      priority: 'soon',
      title: 'Daily diary missing',
      detail: 'No meals, naps, or mood logged today. Write the parent-facing diary before pickup.',
    })
  } else if (log.meals.some((m) => m.amount === 'none' || m.amount === 'some')) {
    add({
      area: 'meal',
      priority: 'soon',
      title: 'Low intake today',
      detail: `${childName(child)} ate ${log.meals.map((m) => `${m.type} (${m.amount})`).join(', ')}. Offer a preferred snack and note for parents.`,
    })
  }

  for (const v of state.vaccinations.filter((x) => x.childId === child.id)) {
    if (v.status === 'overdue') {
      add({
        area: 'health',
        priority: 'urgent',
        title: `${v.vaccine} overdue`,
        detail: `Due ${v.dueDate}. Ask family for a clinic date before the child can stay in ratio-compliant group care.`,
      })
    } else if (v.status === 'due') {
      add({
        area: 'health',
        priority: 'soon',
        title: `${v.vaccine} due`,
        detail: `Due ${v.dueDate}. Send reminder and update the immunization record.`,
      })
    } else if (v.status === 'scheduled') {
      add({
        area: 'health',
        priority: 'watch',
        title: `${v.vaccine} scheduled`,
        detail: `On the calendar for ${v.dueDate}. Confirm after the visit.`,
      })
    }
  }

  for (const med of state.medications.filter((m) => m.childId === child.id)) {
    add({
      area: 'health',
      priority: 'watch',
      title: `Med plan: ${med.name}`,
      detail: `${med.dosage} · ${med.schedule}. Consent ${med.parentConsent ? 'on file' : 'MISSING'}. Log each administration.`,
    })
  }

  for (const doc of state.documents.filter((d) => d.childId === child.id && d.status !== 'approved')) {
    add({
      area: 'health',
      priority: doc.status === 'expired' ? 'urgent' : 'soon',
      title: `${doc.title} ${doc.status}`,
      detail: 'Cannot close the child file until this record is current.',
    })
  }

  if (child.allergies.some((a) => a.severity === 'severe')) {
    add({
      area: 'meal',
      priority: 'urgent',
      title: 'Severe allergy — kitchen check',
      detail: `Verify today’s menu against ${child.allergies.map((a) => a.name).join(', ')} and that rescue meds are in the room kit.`,
    })
  }

  const recentIncidents = state.incidents.filter((i) => i.childId === child.id)
  if (recentIncidents.length) {
    const last = recentIncidents[0]
    add({
      area: 'safety',
      priority: last.severity === 'high' ? 'urgent' : 'soon',
      title: `Follow up: ${last.type.toLowerCase()}`,
      detail: last.action,
    })
  }

  if (child.custodyNotes) {
    add({
      area: 'safety',
      priority: 'urgent',
      title: 'Custody / pickup restriction',
      detail: child.custodyNotes,
    })
  }

  const obs = state.observations.filter((o) => o.childId === child.id)
  if (!obs.length) {
    add({
      area: 'education',
      priority: 'soon',
      title: 'No learning observation this week',
      detail: 'Capture one note in a developmental domain so the education plan stays evidence-based.',
    })
  } else {
    add({
      area: 'education',
      priority: 'watch',
      title: `Continue ${obs[0].domain.toLowerCase()} work`,
      detail: obs[0].nextSteps,
    })
  }

  return tasks
}

function buildReport(state: AppState, worker: TeacherWorker, child: Child, staffName: string, tasks: WorkerTask[]): WorkerReport {
  const t = todayStr()
  const log = state.dailyLogs.find((d) => d.childId === child.id && d.date === t)
  const att = state.attendance.find((a) => a.childId === child.id && a.date === t)
  const room = state.classrooms.find((r) => r.id === child.classroomId)
  const highlights = [
    att?.checkIn ? `Arrived ${att.checkIn}${att.checkOut ? `, picked up ${att.checkOut}` : ', still on site'}.` : 'Not yet on the attendance board.',
    log ? `Mood: ${log.mood || 'not logged'}. ${log.notes || ''}`.trim() : 'Daily diary not started.',
    child.allergies.length ? `Allergy flag: ${child.allergies.map((a) => `${a.name} (${a.severity})`).join(', ')}.` : 'No known allergies.',
  ]
  const risks = tasks.filter((x) => x.priority === 'urgent').map((x) => x.title)
  const open = tasks.filter((x) => !x.done).length
  return {
    id: `rep-${worker.id}-${t}`,
    workerId: worker.id,
    childId: child.id,
    generatedAt: isoNow(),
    summary: `${staffName} (caseload teacher) reviewed ${childName(child)}, age ${ageLabel(child.dob)}, in ${room?.name ?? 'an unassigned room'}. ${open} open follow-ups. ${child.medicalNotes || 'No extra medical notes.'}`,
    highlights,
    risks: risks.length ? risks : ['No urgent risks on this pass.'],
  }
}

function buildMealPlan(worker: TeacherWorker, child: Child): MealPlan {
  const goals = [
    child.allergies.length ? `Zero exposure to ${child.allergies.map((a) => a.name).join(', ')}.` : 'Offer a fruit or vegetable at every meal.',
    avoidList(child).infant ? 'Follow bottle volumes; keep upright 15 minutes after feeds.' : 'Support independent eating and trying one new food this week.',
    child.foodPreferences || 'Match family preferences where they do not conflict with allergy safety.',
  ]
  return {
    id: `meal-${worker.id}`,
    workerId: worker.id,
    childId: child.id,
    generatedAt: isoNow(),
    goals,
    days: weekdayNames().map((_, i) => mealFor(child, i)),
  }
}

function buildHealthPlan(state: AppState, worker: TeacherWorker, child: Child): HealthPlan {
  const vax = state.vaccinations.filter((v) => v.childId === child.id)
  const meds = state.medications.filter((m) => m.childId === child.id)
  const incidents = state.incidents.filter((i) => i.childId === child.id)
  return {
    id: `hp-${worker.id}`,
    workerId: worker.id,
    childId: child.id,
    generatedAt: isoNow(),
    focus: [
      child.medicalNotes || 'Routine well-child monitoring.',
      child.allergies.length ? `Allergy action: ${child.allergies.map((a) => `${a.name} (${a.severity})`).join(', ')}.` : 'No allergy action plan required.',
    ],
    medications: meds.length
      ? meds.map((m) => `${m.name} — ${m.dosage}, ${m.schedule}${m.parentConsent ? '' : ' (consent missing)'}`)
      : ['No standing medications.'],
    immunizations: vax.map((v) => `${v.vaccine}: ${v.status}${v.givenDate ? ` (${v.givenDate})` : `, due ${v.dueDate}`}`),
    monitoring: [
      incidents.length ? `Recent incident (${incidents[0].type}): watch for recurrence this week.` : 'No recent incidents.',
      avoidList(child).infant ? 'Safe sleep checks every 15 minutes while napping.' : 'Outdoor play: sunscreen and hydration after lunch.',
    ],
    parentActions: [
      vax.some((v) => v.status === 'overdue' || v.status === 'due')
        ? 'Book or send proof of the outstanding immunization.'
        : 'Keep the immunization record current after any clinic visit.',
      'Tell the caseload teacher about fever, new meds, or night-time symptoms at drop-off.',
    ],
  }
}

function buildEducationPlan(state: AppState, worker: TeacherWorker, child: Child): EducationPlan {
  const obs = state.observations.filter((o) => o.childId === child.id)
  const infant = avoidList(child).infant || ageLabel(child.dob).includes('months')
  const bite = state.incidents.some((i) => i.childId === child.id && i.type.toLowerCase().includes('bite'))
  const domains = obs.length
    ? [...new Set(obs.map((o) => o.domain))]
    : infant
      ? ['Physical', 'Social-emotional']
      : ['Language', 'Numeracy', 'Social-emotional']
  const thisWeek = infant
    ? ['Tummy time twice before noon', 'Supported sitting with pillows', 'Serve-and-return talk during bottles']
    : bite
      ? ['Gentle-hands practice at arrival', 'Turn-taking with a timer in block play', 'Calm-down basket rehearsal after lunch']
      : obs[0]?.nextSteps
        ? [obs[0].nextSteps, 'Small-group story retell', 'Outdoor counting walk']
        : ['Name writing at sign-in', 'One STEM tray (pouring or sorting)', 'Peer collaboration in dramatic play']
  return {
    id: `ed-${worker.id}`,
    workerId: worker.id,
    childId: child.id,
    generatedAt: isoNow(),
    domainFocus: domains,
    thisWeek,
    nextSteps: obs.map((o) => `${o.domain}: ${o.nextSteps}`).concat(infant ? ['Track rolling and reaching in the diary'] : ['Share one work sample with family Friday']),
    homeIdeas: infant
      ? ['Tummy time on a blanket after a diaper change', 'Narrate routines (“now we wash hands”)']
      : ['Read one picture book and ask “what happens next?”', 'Count snacks together at the table'],
  }
}

export const CASELOAD: { workerId: string; staffId: string; childId: string }[] = [
  { workerId: 'w-jordan-leo', staffId: 's-jordan', childId: 'c-leo' },
  { workerId: 'w-nina-mira', staffId: 's-nina', childId: 'c-mira' },
  { workerId: 'w-omar-noah', staffId: 's-omar', childId: 'c-noah' },
  { workerId: 'w-elena-ava', staffId: 's-elena', childId: 'c-ava' },
  { workerId: 'w-samira-hana', staffId: 's-samira', childId: 'c-hana' },
]

export function seedTeacherWorkers(): TeacherWorker[] {
  return CASELOAD.map((c) => ({
    id: c.workerId,
    staffId: c.staffId,
    childId: c.childId,
    status: 'monitoring' as const,
  }))
}

export function applyWorkerRun(state: AppState): AppState {
  const now = isoNow()
  const done = new Set(state.workerTasks.filter((t) => t.done).map((t) => t.id))
  const tasks: WorkerTask[] = []
  const reports: WorkerReport[] = []
  const mealPlans: MealPlan[] = []
  const healthPlans: HealthPlan[] = []
  const educationPlans: EducationPlan[] = []

  const workers = state.teacherWorkers.length ? state.teacherWorkers : seedTeacherWorkers()

  for (const worker of workers) {
    if (worker.status === 'paused') continue
    const child = state.children.find((c) => c.id === worker.childId)
    if (!child) continue
    const staff = state.staff.find((s) => s.id === worker.staffId)
    const built = buildTasks(state, worker, child).map((t) => ({ ...t, done: done.has(t.id) }))
    tasks.push(...built)
    reports.push(buildReport(state, worker, child, staff?.name ?? 'Caseload teacher', built))
    mealPlans.push(buildMealPlan(worker, child))
    healthPlans.push(buildHealthPlan(state, worker, child))
    educationPlans.push(buildEducationPlan(state, worker, child))
  }

  return {
    ...state,
    teacherWorkers: workers.map((w) => ({ ...w, lastRunAt: now })),
    workerTasks: tasks,
    workerReports: reports,
    mealPlans,
    healthPlans,
    educationPlans,
  }
}
