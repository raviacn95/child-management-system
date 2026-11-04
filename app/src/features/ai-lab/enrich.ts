const SKILLS: { skill: string; pattern: RegExp }[] = [
  { skill: 'persistence', pattern: /puzzle|block|tower|finish|stack/i },
  { skill: 'collaboration', pattern: /\bwith\b|share|friend|together|\bturns?\b/i },
  { skill: 'hand-eye coordination', pattern: /block|puzzle|paint|draw|crayon/i },
  { skill: 'problem solving', pattern: /puzzle|block|build|design|city/i },
  { skill: 'language', pattern: /word|sentence|story|letter|\bsaid\b/i },
  { skill: 'confidence', pattern: /proud|\bown\b|\bhelp\b|share|finish|sentence/i },
  { skill: 'creativity', pattern: /paint|draw|rainbow|design|\bart\b/i },
  { skill: 'gross motor', pattern: /garden|walk|run|dance|movement/i },
]

export function skillsIn(text: string) {
  return SKILLS.filter((row) => row.pattern.test(text)).map((row) => row.skill)
}

export function expandObservation(note: string) {
  const clean = note.trim()
  const skills = skillsIn(clean)
  if (!skills.length) {
    return {
      skills,
      text: clean,
      caution: 'No pattern matched, so the teacher’s words stay as written.',
    }
  }
  return {
    skills,
    text: `Demonstrated ${skills.join(', ')}.`,
    caution: 'A lexicon expanded the note. A teacher still decides what to record.',
  }
}
