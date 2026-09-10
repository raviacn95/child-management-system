export type CountryCode = 'IN' | 'US' | 'AE' | 'SG' | 'GB'

export type PayMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash' | 'neft' | 'cheque'

export interface CountryPack {
  code: CountryCode
  name: string
  nativeName: string
  currency: string
  locale: string
  symbol: string
  phonePrefix: string
  pincodeLabel: string
  pincodeHint: string
  pincodePattern: string
  nationality: string
  languages: string[]
  academicYear: string
  stages: { id: string; label: string; ages: string }[]
  learningDomains: string[]
  feeHeads: string[]
  tuitionGst: number
  extrasGst: number
  payments: { id: PayMethod; label: string }[]
  defaultPay: PayMethod
  vaccines: { id: string; name: string; note: string }[]
  vaccineProgram: string
  growthStandard: string
  mealsTitle: string
  mealsNote: string
  mealSlots: { key: 'breakfast' | 'amSnack' | 'lunch' | 'pmSnack'; label: string }[]
  documents: { title: string; category: string }[]
  holidays: { title: string; month: number; day: number }[]
  licensing: string
  ratioNote: string
  idLabel: string
  idHint: string
  categories: string[]
  bloodGroups: string[]
  diets: string[]
  motherTongues: string[]
  transportLabel: string
  messaging: string
  shopName: string
  shopTagline: string
  clubName: string
  clubRate: number
  apparelGstUnder: { limit: number; rate: number; over: number }
  diaperGst: number
  toyGst: number
  cod: {
    enabled: boolean
    min: number
    max: number
    fee: number
    freeAbove: number
    label: string
    recommend: string
  }
  fxFromInr: number
  samplePincodes: { code: string; area: string; days: number; cod: boolean }[]
}

export const COUNTRIES: Record<CountryCode, CountryPack> = {
  IN: {
    code: 'IN',
    name: 'India',
    nativeName: 'भारत',
    currency: 'INR',
    locale: 'en-IN',
    symbol: '₹',
    phonePrefix: '+91',
    pincodeLabel: 'PIN code',
    pincodeHint: '6-digit India Post PIN',
    pincodePattern: '^\\d{6}$',
    nationality: 'Indian',
    languages: ['English', 'Hindi', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Malayalam'],
    academicYear: 'April – March',
    stages: [
      { id: 'playgroup', label: 'Playgroup', ages: '1.5–2.5 yr' },
      { id: 'nursery', label: 'Nursery', ages: '2.5–3.5 yr' },
      { id: 'lkg', label: 'LKG', ages: '3.5–4.5 yr' },
      { id: 'ukg', label: 'UKG', ages: '4.5–6 yr' },
    ],
    learningDomains: [
      'Language & literacy (NEP ECCE)',
      'Physical development',
      'Socio-emotional',
      'Cognitive / numeracy',
      'Aesthetic & cultural',
      'Health & hygiene',
    ],
    feeHeads: [
      'Admission (one-time)',
      'Monthly tuition',
      'Transport / van',
      'Tiffin / meals',
      'Activity & extra-curricular',
      'Uniform & books',
      'Sibling concession',
      'Late fee',
    ],
    tuitionGst: 0,
    extrasGst: 0.18,
    payments: [
      { id: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
      { id: 'cod', label: 'Cash on delivery' },
      { id: 'card', label: 'Debit / credit card' },
      { id: 'netbanking', label: 'Net banking' },
      { id: 'wallet', label: 'Willow Club wallet' },
      { id: 'cash', label: 'Cash at centre' },
      { id: 'neft', label: 'NEFT / IMPS' },
      { id: 'cheque', label: 'Cheque' },
    ],
    defaultPay: 'upi',
    vaccineProgram: 'UIP + IAP recommended schedule (MCP card)',
    growthStandard: 'IAP / WHO growth charts — BMI is a screen, not a diagnosis',
    vaccines: [
      { id: 'bcg', name: 'BCG', note: 'Birth' },
      { id: 'opv', name: 'OPV / IPV', note: 'Birth, 6–14 weeks, boosters' },
      { id: 'hepb', name: 'Hepatitis B', note: 'Birth + infant series' },
      { id: 'penta', name: 'Pentavalent (DPT + HepB + Hib)', note: '6, 10, 14 weeks' },
      { id: 'pcv', name: 'PCV', note: 'Pneumococcal' },
      { id: 'rota', name: 'Rotavirus', note: 'Oral drops' },
      { id: 'mr', name: 'MR (Measles–Rubella)', note: '9–12 mo + booster' },
      { id: 'dptb', name: 'DPT booster', note: '16–24 mo / 4–6 yr' },
      { id: 'vita', name: 'Vitamin A', note: '9 mo onwards' },
      { id: 'td', name: 'Td / DPT school booster', note: 'UKG / school entry' },
    ],
    mealsTitle: 'Tiffin & FSSAI kitchen',
    mealsNote: 'Nut-free kitchen, vegetarian default, Jain / Halal / egg notes on the child file. Mid-day meal style plates with dal, grain, sabzi, curd, seasonal fruit.',
    mealSlots: [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'amSnack', label: 'Fruit break' },
      { key: 'lunch', label: 'Tiffin / lunch' },
      { key: 'pmSnack', label: 'Evening snack' },
    ],
    documents: [
      { title: 'Birth certificate', category: 'KYC' },
      { title: 'Address proof', category: 'KYC' },
      { title: 'Parent ID (last 4 on file)', category: 'KYC' },
      { title: 'MCP immunization card', category: 'Health' },
      { title: 'Blood group report', category: 'Health' },
      { title: 'Passport-size photos', category: 'Admission' },
      { title: 'Transfer certificate', category: 'Admission' },
      { title: 'EWS / RTE certificate (if claimed)', category: 'RTE' },
    ],
    holidays: [
      { title: 'Republic Day', month: 1, day: 26 },
      { title: 'Holi', month: 3, day: 14 },
      { title: 'Ugadi / Gudi Padwa', month: 3, day: 19 },
      { title: 'Eid al-Fitr', month: 3, day: 21 },
      { title: 'Independence Day', month: 8, day: 15 },
      { title: 'Ganesh Chaturthi', month: 8, day: 27 },
      { title: 'Gandhi Jayanti', month: 10, day: 2 },
      { title: 'Dussehra', month: 10, day: 21 },
      { title: 'Diwali', month: 11, day: 8 },
      { title: 'Christmas', month: 12, day: 25 },
    ],
    licensing: 'State education / WCD playschool norms · FSSAI kitchen · DPDP 2023 child data',
    ratioNote: 'Playgroup 1:8 · Nursery 1:12 · LKG/UKG 1:15 (state circulars vary)',
    idLabel: 'Govt ID last 4',
    idHint: 'Never store a full Aadhaar. Last 4 only, parent-consented, DPDP-minimised.',
    categories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Prefer not to say'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    diets: ['Vegetarian', 'Eggetarian', 'Jain (no root veg)', 'Halal', 'No onion-garlic', 'Allergen-only limits'],
    motherTongues: ['Hindi', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Malayalam', 'English', 'Punjabi', 'Urdu'],
    transportLabel: 'Van / bus routes',
    messaging: 'WhatsApp + SMS + in-app (Pathshala / Fledgly style)',
    shopName: 'Willow Mart',
    shopTagline: 'The big store for little ones — fashion, diapers, feeding, toys, gear, school',
    clubName: 'Willow Club',
    clubRate: 0.1,
    apparelGstUnder: { limit: 1000, rate: 0.05, over: 0.12 },
    diaperGst: 0.18,
    toyGst: 0.12,
    cod: {
      enabled: true,
      min: 99,
      max: 10000,
      fee: 49,
      freeAbove: 499,
      label: 'Cash on delivery',
      recommend:
        'Recommended: pay the rider in cash or UPI on delivery. Best for first orders, metro PIN codes, and carts under ₹10,000.',
    },
    fxFromInr: 1,
    samplePincodes: [
      { code: '560038', area: 'Indiranagar, Bengaluru', days: 1, cod: true },
      { code: '560102', area: 'HSR Layout, Bengaluru', days: 1, cod: true },
      { code: '400050', area: 'Bandra West, Mumbai', days: 2, cod: true },
      { code: '110048', area: 'Greater Kailash, Delhi', days: 2, cod: true },
      { code: '600020', area: 'Adyar, Chennai', days: 3, cod: true },
      { code: '500034', area: 'Banjara Hills, Hyderabad', days: 3, cod: true },
      { code: '700019', area: 'Ballygunge, Kolkata', days: 4, cod: true },
      { code: '999999', area: 'Remote / not serviceable', days: 0, cod: false },
    ],
  },
  US: {
    code: 'US',
    name: 'United States',
    nativeName: 'United States',
    currency: 'USD',
    locale: 'en-US',
    symbol: '$',
    phonePrefix: '+1',
    pincodeLabel: 'ZIP code',
    pincodeHint: '5-digit ZIP',
    pincodePattern: '^\\d{5}$',
    nationality: 'American',
    languages: ['English', 'Spanish'],
    academicYear: 'August – June',
    stages: [
      { id: 'infant', label: 'Infants', ages: '6–18 mo' },
      { id: 'toddler', label: 'Toddlers', ages: '18–36 mo' },
      { id: 'preschool', label: 'Preschool', ages: '3–5 yr' },
    ],
    learningDomains: ['Language', 'Physical', 'Numeracy', 'Social-emotional', 'Creative'],
    feeHeads: ['Registration', 'Tuition', 'Late pickup', 'Subsidy adjustment'],
    tuitionGst: 0,
    extrasGst: 0,
    payments: [
      { id: 'card', label: 'Card' },
      { id: 'wallet', label: 'ACH / wallet' },
      { id: 'cash', label: 'Cash' },
    ],
    defaultPay: 'card',
    vaccineProgram: 'CDC / state childcare immunization',
    growthStandard: 'CDC growth charts',
    vaccines: [
      { id: 'dtap', name: 'DTaP', note: '' },
      { id: 'mmr', name: 'MMR', note: '' },
      { id: 'hepb', name: 'Hep B', note: '' },
      { id: 'hib', name: 'Hib', note: '' },
      { id: 'var', name: 'Varicella', note: '' },
      { id: 'ipv', name: 'IPV', note: '' },
    ],
    mealsTitle: 'CACFP menus',
    mealsNote: 'Peanut-free kitchen, allergen flags, breakfast through PM snack.',
    mealSlots: [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'amSnack', label: 'AM snack' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'pmSnack', label: 'PM snack' },
    ],
    documents: [
      { title: 'Immunization record', category: 'Health' },
      { title: 'Physical exam', category: 'Health' },
      { title: 'Custody papers', category: 'Legal' },
    ],
    holidays: [
      { title: 'Independence Day', month: 7, day: 4 },
      { title: 'Thanksgiving', month: 11, day: 26 },
      { title: 'Christmas', month: 12, day: 25 },
    ],
    licensing: 'State ECE licensing + CACFP',
    ratioNote: 'Infants 1:4 · Toddlers 1:5 · Preschool 1:8',
    idLabel: 'ID last 4',
    idHint: 'Optional last 4 of a government ID.',
    categories: ['Prefer not to say'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    diets: ['No restriction', 'Vegetarian', 'Allergen-only limits'],
    motherTongues: ['English', 'Spanish'],
    transportLabel: 'Bus routes',
    messaging: 'In-app + email',
    shopName: 'Willow Mart',
    shopTagline: 'Clothes, care, and classroom kits',
    clubName: 'Willow Club',
    clubRate: 0.05,
    apparelGstUnder: { limit: 0, rate: 0.08, over: 0.08 },
    diaperGst: 0.08,
    toyGst: 0.08,
    cod: {
      enabled: false,
      min: 0,
      max: 0,
      fee: 0,
      freeAbove: 0,
      label: 'Pay on delivery',
      recommend: 'Cash on delivery is not offered in this country. Pay by card at checkout.',
    },
    fxFromInr: 0.012,
    samplePincodes: [
      { code: '78704', area: 'Austin, TX', days: 3, cod: false },
      { code: '10001', area: 'New York, NY', days: 4, cod: false },
    ],
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    nativeName: 'الإمارات',
    currency: 'AED',
    locale: 'en-AE',
    symbol: 'AED',
    phonePrefix: '+971',
    pincodeLabel: 'Emirate / area',
    pincodeHint: 'e.g. 00000',
    pincodePattern: '^\\d{5}$',
    nationality: 'UAE resident',
    languages: ['English', 'Arabic', 'Hindi'],
    academicYear: 'September – June',
    stages: [
      { id: 'fs1', label: 'FS1', ages: '3–4 yr' },
      { id: 'fs2', label: 'FS2', ages: '4–5 yr' },
    ],
    learningDomains: ['Literacy', 'Physical', 'Maths', 'Personal & social', 'Expressive arts'],
    feeHeads: ['Registration', 'Term tuition', 'Transport', 'Uniform'],
    tuitionGst: 0.05,
    extrasGst: 0.05,
    payments: [
      { id: 'card', label: 'Card' },
      { id: 'cod', label: 'Cash on delivery' },
      { id: 'wallet', label: 'Wallet' },
    ],
    defaultPay: 'card',
    vaccineProgram: 'MOHAP childhood schedule',
    growthStandard: 'WHO growth charts',
    vaccines: [
      { id: 'bcg', name: 'BCG', note: '' },
      { id: 'hex', name: 'Hexavalent', note: '' },
      { id: 'mmr', name: 'MMR', note: '' },
    ],
    mealsTitle: 'Halal kitchen',
    mealsNote: 'Halal default, nut-aware, Arabic + international tiffin.',
    mealSlots: [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'amSnack', label: 'Snack' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'pmSnack', label: 'PM snack' },
    ],
    documents: [
      { title: 'Emirates ID (last 4)', category: 'KYC' },
      { title: 'Passport copy', category: 'KYC' },
      { title: 'Vaccination card', category: 'Health' },
    ],
    holidays: [
      { title: 'UAE National Day', month: 12, day: 2 },
      { title: 'Eid al-Fitr', month: 3, day: 21 },
    ],
    licensing: 'KHDA / ADEK / SPEA nursery regulations',
    ratioNote: 'FS ratios per emirate circular',
    idLabel: 'Emirates ID last 4',
    idHint: 'Last 4 only.',
    categories: ['Prefer not to say'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    diets: ['Halal', 'Vegetarian', 'Allergen-only limits'],
    motherTongues: ['Arabic', 'English', 'Hindi', 'Malayalam'],
    transportLabel: 'School bus',
    messaging: 'WhatsApp + in-app',
    shopName: 'Willow Mart',
    shopTagline: 'Nursery fashion, feeding, and gear',
    clubName: 'Willow Club',
    clubRate: 0.08,
    apparelGstUnder: { limit: 0, rate: 0.05, over: 0.05 },
    diaperGst: 0.05,
    toyGst: 0.05,
    cod: {
      enabled: true,
      min: 50,
      max: 1500,
      fee: 10,
      freeAbove: 200,
      label: 'Cash on delivery',
      recommend: 'COD is available in Dubai and Abu Dhabi metro areas.',
    },
    fxFromInr: 0.044,
    samplePincodes: [
      { code: '00000', area: 'Dubai Marina', days: 1, cod: true },
      { code: '11111', area: 'Abu Dhabi', days: 2, cod: true },
    ],
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    nativeName: 'Singapore',
    currency: 'SGD',
    locale: 'en-SG',
    symbol: 'S$',
    phonePrefix: '+65',
    pincodeLabel: 'Postal code',
    pincodeHint: '6-digit postal code',
    pincodePattern: '^\\d{6}$',
    nationality: 'Singaporean / PR',
    languages: ['English', 'Mandarin', 'Malay', 'Tamil'],
    academicYear: 'January – November',
    stages: [
      { id: 'n1', label: 'Nursery 1', ages: '18–30 mo' },
      { id: 'n2', label: 'Nursery 2', ages: '30–36 mo' },
      { id: 'k1', label: 'K1', ages: '4 yr' },
      { id: 'k2', label: 'K2', ages: '5–6 yr' },
    ],
    learningDomains: ['Language', 'Numeracy', 'Motor', 'Social', 'Aesthetics'],
    feeHeads: ['Registration', 'Monthly fee', 'GST', 'Transport'],
    tuitionGst: 0.09,
    extrasGst: 0.09,
    payments: [
      { id: 'card', label: 'Card / PayNow' },
      { id: 'wallet', label: 'PayNow' },
    ],
    defaultPay: 'card',
    vaccineProgram: 'NIR childhood immunisation',
    growthStandard: 'WHO growth charts',
    vaccines: [
      { id: 'bcg', name: 'BCG', note: '' },
      { id: 'hex', name: '5-in-1 / 6-in-1', note: '' },
      { id: 'mmr', name: 'MMR', note: '' },
    ],
    mealsTitle: 'ECDA meal guidelines',
    mealsNote: 'Healthy-meals catering, no sugary drinks.',
    mealSlots: [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'amSnack', label: 'AM snack' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'pmSnack', label: 'PM snack' },
    ],
    documents: [
      { title: 'Birth cert / FIN', category: 'KYC' },
      { title: 'Health booklet', category: 'Health' },
    ],
    holidays: [
      { title: 'National Day', month: 8, day: 9 },
      { title: 'Deepavali', month: 11, day: 8 },
      { title: 'Christmas', month: 12, day: 25 },
    ],
    licensing: 'ECDA preschool licensing',
    ratioNote: 'ECDA infant / nursery / kindergarten ratios',
    idLabel: 'NRIC / FIN last 4',
    idHint: 'Last 4 only.',
    categories: ['Prefer not to say'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    diets: ['No pork', 'Vegetarian', 'Halal', 'Allergen-only limits'],
    motherTongues: ['English', 'Mandarin', 'Malay', 'Tamil'],
    transportLabel: 'School bus',
    messaging: 'In-app + WhatsApp',
    shopName: 'Willow Mart',
    shopTagline: 'Preschool uniforms, bottles, and books',
    clubName: 'Willow Club',
    clubRate: 0.05,
    apparelGstUnder: { limit: 0, rate: 0.09, over: 0.09 },
    diaperGst: 0.09,
    toyGst: 0.09,
    cod: {
      enabled: false,
      min: 0,
      max: 0,
      fee: 0,
      freeAbove: 0,
      label: 'Pay on delivery',
      recommend: 'COD is uncommon in Singapore. PayNow / card at checkout.',
    },
    fxFromInr: 0.015,
    samplePincodes: [{ code: '238801', area: 'Orchard', days: 2, cod: false }],
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    currency: 'GBP',
    locale: 'en-GB',
    symbol: '£',
    phonePrefix: '+44',
    pincodeLabel: 'Postcode',
    pincodeHint: 'e.g. SW1A 1AA',
    pincodePattern: '^[A-Z]{1,2}\\d.*$',
    nationality: 'British',
    languages: ['English'],
    academicYear: 'September – July',
    stages: [
      { id: 'baby', label: 'Baby room', ages: '0–2 yr' },
      { id: 'toddler', label: 'Toddler', ages: '2–3 yr' },
      { id: 'preschool', label: 'Pre-school', ages: '3–5 yr' },
    ],
    learningDomains: ['Communication & language', 'PSED', 'Physical', 'Literacy', 'Maths', 'UW', 'EAD'],
    feeHeads: ['Deposit', 'Weekly fees', 'Funded hours', 'Late collection'],
    tuitionGst: 0.2,
    extrasGst: 0.2,
    payments: [
      { id: 'card', label: 'Card' },
      { id: 'wallet', label: 'Direct debit' },
    ],
    defaultPay: 'card',
    vaccineProgram: 'NHS routine childhood immunisations',
    growthStandard: 'UK-WHO growth charts',
    vaccines: [
      { id: '6in1', name: '6-in-1', note: '' },
      { id: 'mmr', name: 'MMR', note: '' },
      { id: 'menb', name: 'MenB', note: '' },
    ],
    mealsTitle: 'EYFS meals',
    mealsNote: 'Allergen labelling (14 allergens), packed-lunch policy.',
    mealSlots: [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'amSnack', label: 'Snack' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'pmSnack', label: 'Tea' },
    ],
    documents: [
      { title: 'Red book', category: 'Health' },
      { title: 'Allergen form', category: 'Health' },
    ],
    holidays: [
      { title: 'Early May bank holiday', month: 5, day: 4 },
      { title: 'Christmas', month: 12, day: 25 },
    ],
    licensing: 'Ofsted EYFS',
    ratioNote: 'EYFS statutory ratios',
    idLabel: 'ID last 4',
    idHint: 'Optional.',
    categories: ['Prefer not to say'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    diets: ['No restriction', 'Vegetarian', 'Halal', 'Allergen-only limits'],
    motherTongues: ['English', 'Polish', 'Urdu', 'Punjabi'],
    transportLabel: 'Minibus',
    messaging: 'In-app + email',
    shopName: 'Willow Mart',
    shopTagline: 'Uniforms, wellies, and lunch boxes',
    clubName: 'Willow Club',
    clubRate: 0.05,
    apparelGstUnder: { limit: 0, rate: 0.2, over: 0.2 },
    diaperGst: 0.2,
    toyGst: 0.2,
    cod: {
      enabled: false,
      min: 0,
      max: 0,
      fee: 0,
      freeAbove: 0,
      label: 'Cash on delivery',
      recommend: 'Pay by card. Cash on delivery is not offered.',
    },
    fxFromInr: 0.009,
    samplePincodes: [{ code: 'SW1A1AA', area: 'Westminster', days: 3, cod: false }],
  },
}

export function packOf(code?: string | null): CountryPack {
  if (code && code in COUNTRIES) return COUNTRIES[code as CountryCode]
  return COUNTRIES.IN
}

export function convertInr(amountInr: number, country: CountryPack) {
  if (country.code === 'IN') return Math.round(amountInr)
  const n = amountInr * country.fxFromInr
  return country.currency === 'USD' || country.currency === 'GBP' || country.currency === 'SGD' || country.currency === 'AED'
    ? Math.round(n * 100) / 100
    : Math.round(n)
}

export function lookupPincode(country: CountryPack, pin: string) {
  const exact = country.samplePincodes.find((p) => p.code === pin)
  if (exact) return exact
  if (country.code === 'IN' && /^\d{6}$/.test(pin)) {
    const metro = /^(11|12|40|56|60|50|70|38|41|45)/.test(pin)
    return { code: pin, area: metro ? 'Serviceable metro / tier-1' : 'Serviceable (standard)', days: metro ? 2 : 5, cod: pin !== '999999' }
  }
  if (pin && new RegExp(country.pincodePattern).test(pin)) {
    return { code: pin, area: 'Serviceable', days: 4, cod: country.cod.enabled }
  }
  return null
}

export function holidayDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
