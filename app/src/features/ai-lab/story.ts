function beat(text: string) {
  const line = text.toLowerCase()
  if (/puzzle/.test(line)) return 'worked on a puzzle'
  if (/block|city|tower/.test(line)) return 'built with blocks'
  if (/paint|draw|rainbow|dragon/.test(line)) return 'painted'
  if (/share|toy/.test(line)) return 'shared a toy'
  if (/lunch|tiffin|ate|meal/.test(line)) return 'ate lunch'
  if (/garden|walk/.test(line)) return 'walked outside'
  if (/letter|story|word/.test(line)) return 'played with words'
  return ''
}

export function dayStory(input: { name: string; lines: string[] }) {
  const beats: string[] = []
  for (const line of input.lines) {
    const next = beat(line)
    if (next && !beats.includes(next)) beats.push(next)
  }
  if (!beats.length) beats.push('had a day worth keeping')
  const body =
    beats.length === 1 ? beats[0] : `${beats.slice(0, -1).join(', ')}, and ${beats[beats.length - 1]}`
  return {
    beats,
    text: `Today ${input.name} ${body}.`,
  }
}
