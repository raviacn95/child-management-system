import { ageMonths } from '../lib'
import type { BmiBand, Child, SkillId } from '../types'

export const SKILLS: {
  id: SkillId
  name: string
  why: string
  infant: string
  toddler: string
  preschool: string
}[] = [
  { id: 'language', name: 'Language & stories', why: 'Vocabulary and thinking out loud.', infant: 'Narrate diaper and bottle: “now we wash hands.”', toddler: 'Two-step directions and new words at dinner.', preschool: 'Retell a picture book and invent the ending.' },
  { id: 'numeracy', name: 'Numeracy & logic', why: 'Quantity, pattern, and calm problem-solving.', infant: 'Count fingers and stacked cups out loud.', toddler: 'Sort socks by color; count snacks to five.', preschool: 'Simple adding with blocks; “what is one more?”' },
  { id: 'motor', name: 'Gross motor & sport', why: 'Balance, strength, future sport confidence.', infant: 'Tummy time and supported standing at the sofa.', toddler: 'Walk the curb, kick a soft ball, dance freeze.', preschool: 'Obstacle path, catching, 20-minute park burst.' },
  { id: 'fineMotor', name: 'Fine motor & writing', why: 'Hands ready for tools, art, and letters.', infant: 'Grasp rings and transfer a rattle hand to hand.', toddler: 'Pincer snack, chunky crayons, stacking.', preschool: 'Playdough letters, scissors, name tracing.' },
  { id: 'social', name: 'Social-emotional', why: 'Friends, repair, and naming feelings.', infant: 'Serve-and-return smiles; mirror play.', toddler: 'Name mad/sad/glad; practice “your turn.”', preschool: 'Role-play apology and “I need space.”' },
  { id: 'music', name: 'Music & rhythm', why: 'Memory, language, and timing.', infant: 'Lullaby plus patting a steady beat.', toddler: 'Clap patterns and kitchen-band pots.', preschool: 'Call-and-response songs; keep a simple beat.' },
  { id: 'art', name: 'Art & making', why: 'Creativity and finishing what you start.', infant: 'High-contrast cards and fabric textures.', toddler: 'Big paper, stickers, water painting outside.', preschool: 'A 3-step project they can show on Friday.' },
  { id: 'science', name: 'Nature & science', why: 'Curiosity and “why” questions.', infant: 'Outdoor air and watching leaves move.', toddler: 'Sink/float in the sink; bug hunt.', preschool: 'Plant a seed; guess then check.' },
  { id: 'focus', name: 'Focus & grit', why: 'Attention span that grows with the child.', infant: 'One toy at a time, then pause.', toddler: '4-minute puzzle before a snack prize.', preschool: 'Finish a 10-minute challenge without switching.' },
  { id: 'leadership', name: 'Character & leadership', why: 'Kindness, responsibility, helping others.', infant: 'Gentle hands with pets and siblings.', toddler: 'A helper job: napkins on the table.', preschool: 'Teach a younger child one game; pack own bag.' },
]

export function ageBand(dob: string): 'infant' | 'toddler' | 'preschool' {
  const m = ageMonths(dob)
  if (m < 18) return 'infant'
  if (m < 36) return 'toddler'
  return 'preschool'
}

export function skillActivity(skill: (typeof SKILLS)[number], dob: string) {
  return skill[ageBand(dob)]
}

export function gamesFor(dob: string) {
  const band = ageBand(dob)
  const all = [
    { id: 'peekaboo', name: 'Peekaboo + wait', minutes: 5, bands: ['infant'], skill: 'social' as SkillId, how: 'Hide, pause, then reveal. Builds attention and joy.' },
    { id: 'tummy', name: 'Tummy-time treasure', minutes: 8, bands: ['infant'], skill: 'motor' as SkillId, how: 'Place a high-contrast toy just out of reach.' },
    { id: 'stack', name: 'Cup stacking', minutes: 8, bands: ['infant', 'toddler'], skill: 'fineMotor' as SkillId, how: 'Knock down, rebuild. Count each cup.' },
    { id: 'chase', name: 'Gentle chase / freeze dance', minutes: 10, bands: ['toddler', 'preschool'], skill: 'motor' as SkillId, how: 'Music on = move; off = statue.' },
    { id: 'memory', name: 'Memory match (4–8 cards)', minutes: 10, bands: ['toddler', 'preschool'], skill: 'focus' as SkillId, how: 'Start with four cards. Celebrate trying.' },
    { id: 'grocery', name: 'Pretend grocery', minutes: 12, bands: ['toddler', 'preschool'], skill: 'language' as SkillId, how: 'List 3 items. Child “sells” them back.' },
    { id: 'obstacle', name: 'Living-room Olympics', minutes: 15, bands: ['preschool'], skill: 'motor' as SkillId, how: 'Cushion climb, crawl tunnel, jump line.' },
    { id: 'storydice', name: 'Story dice / three pictures', minutes: 10, bands: ['preschool'], skill: 'language' as SkillId, how: 'Child tells a story that uses all three.' },
    { id: 'pattern', name: 'Bead / block patterns', minutes: 8, bands: ['toddler', 'preschool'], skill: 'numeracy' as SkillId, how: 'Red-blue-red-blue, then they make the next.' },
    { id: 'helper', name: 'Family helper race', minutes: 8, bands: ['toddler', 'preschool'], skill: 'leadership' as SkillId, how: 'Put away 5 things before the song ends.' },
  ]
  return all.filter((g) => g.bands.includes(band))
}

export function tricksFor(child: Child) {
  const band = ageBand(child.dob)
  const base = [
    { id: `${band}-routine`, title: 'One visible routine card', detail: 'Picture of eat → play → tidy. Predictability grows grit.' },
    { id: `${band}-wait`, title: 'The 10-second wait', detail: 'Ask, then silently count to 10 before helping. Builds focus.' },
    { id: `${band}-sleep`, title: 'Protect the last hour', detail: 'Dim lights, no rush games before bed. Sleep is performance fuel.' },
  ]
  if (band === 'infant') {
    base.push({ id: 'inf-upright', title: 'Upright after bottles', detail: '15 minutes upright if reflux is on the file. Then floor play.' })
  }
  if (band === 'toddler') {
    base.push({ id: 'tod-choice', title: 'Two real choices', detail: 'Blue cup or green cup — not “do you want to leave?”' })
  }
  if (band === 'preschool') {
    base.push({ id: 'pre-teach', title: 'Child teaches you', detail: 'They explain a game back. Teaching locks the skill in.' })
  }
  if (child.allergies.length) {
    base.push({ id: 'all-label', title: 'Allergy script', detail: `Practice: “I cannot eat ${child.allergies[0].name}.” Keep it short and proud.` })
  }
  return base
}

export function homeMeals(child: Child, band: BmiBand) {
  const allergen = child.allergies.map((a) => a.name.toLowerCase())
  const noPeanut = allergen.some((a) => a.includes('peanut'))
  const noEgg = allergen.some((a) => a.includes('egg'))
  const noDairy = allergen.some((a) => a.includes('dairy')) || child.foodPreferences.toLowerCase().includes('dairy')
  const infant = band === 'infant' || child.foodPreferences.toLowerCase().includes('formula') || child.foodPreferences.toLowerCase().includes('breast')
  const veg = child.foodPreferences.toLowerCase().includes('vegetarian')
  const protein = veg ? 'lentils / beans' : noEgg ? 'chicken or beans (no egg)' : 'eggs or beans'
  const milk = noDairy ? 'oat milk' : 'milk'
  const spread = noPeanut ? 'sunflower butter' : 'nut or seed butter per family rules'
  const extra =
    band === 'under'
      ? 'Add an extra snack: full-fat yogurt or avocado toast (allergy-safe).'
      : band === 'high' || band === 'watch'
        ? 'Water first; fruit not juice; play 30 minutes after school before screens.'
        : 'Balanced plate: half color, quarter protein, quarter grain.'

  if (infant) {
    return {
      focus: extra,
      days: [
        { meal: 'Morning', menu: 'Breastmilk or formula as planned · hold upright 15 min' },
        { meal: 'Midday', menu: 'Age-ready puree (carrot/banana) + milk feed' },
        { meal: 'Afternoon', menu: 'Milk feed · tummy time after' },
        { meal: 'Evening', menu: 'Milk feed · no bottle in the crib' },
      ],
    }
  }

  return {
    focus: extra,
    days: [
      { meal: 'Breakfast', menu: `Oats or toast + ${spread} + fruit + ${milk}` },
      { meal: 'Lunch', menu: `Rice or quinoa + ${protein} + two vegetables` },
      { meal: 'Snack', menu: band === 'under' ? `Cheese or hummus + crackers + banana` : `Cucumber + hummus + water` },
      { meal: 'Dinner', menu: `Family plate with ${protein}, veg, grain — same spices, smaller cut` },
    ],
  }
}

export const SKILL_IDS = SKILLS.map((s) => s.id)

export function emptySkills(childId: string): import('../types').SkillProgress[] {
  return SKILLS.map((s, i) => ({
    childId,
    skillId: s.id,
    level: 1,
    xp: i === 0 ? 20 : 0,
  }))
}
