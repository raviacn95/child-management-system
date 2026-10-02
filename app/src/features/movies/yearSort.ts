import { currentYearFirst } from './fresh'

export type YearSort = 'newest' | 'oldest'
export type YearOrder = 'ranked' | YearSort

/** Stable year sort: titles from the same year keep their ranking order. */
export function sortByYear<T extends { year: number }>(list: readonly T[], direction: YearSort): T[] {
  const sign = direction === 'newest' ? -1 : 1
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => sign * (a.item.year - b.item.year) || a.index - b.index)
    .map(({ item }) => item)
}

/** Ranked lists lift this year's titles to the top; year orders replace that partition. */
export function applyYearOrder<T extends { year: number }>(
  list: readonly T[],
  order: YearOrder,
  year = new Date().getFullYear(),
): T[] {
  return order === 'ranked' ? currentYearFirst(list, year) : sortByYear(list, order)
}
