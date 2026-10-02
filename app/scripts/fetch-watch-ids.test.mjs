import { describe, expect, it, vi } from 'vitest'
import {
  buildWatchIdsFile,
  countByPlatform,
  fetchWatchIds,
  labelQuery,
  matchCatalog,
  pickMatches,
  readCatalogRows,
  readTopPicks,
  sparql,
  toWatchIds,
  watchIdsQuery,
} from './fetch-watch-ids.mjs'

const uri = (qid) => ({ value: `http://www.wikidata.org/entity/${qid}` })
const lit = (value) => ({ value })
const idRow = (qid, pid, value, rank = 'NormalRank') => ({
  item: uri(qid),
  pid: lit(pid),
  value: lit(value),
  rank: lit(`http://wikiba.se/ontology#${rank}`),
})
const GTI = 'amzn1.dv.gti.20ba5ecf-147f-7e41-81a6-f6b365ffce44'

describe('readCatalogRows', () => {
  it('reads id, title, year and kind, unescaping quotes', () => {
    const source = `export const MOVIE_ROWS: MovieRow[] = [
  ['minnal-murali', 'Minnal Murali', 2021, 'movie', 'ml', 'superhero', 'netflix', 1, 2, 3, 4, 'Why.'],
  ['queens-gambit', 'The Queen\\'s Gambit', 2020, 'series', 'en', 'drama', 'netflix', 1, 2, 3, 4, 'Why.'],
]`
    expect(readCatalogRows(source)).toEqual([
      { id: 'minnal-murali', title: 'Minnal Murali', year: 2021, kind: 'movie' },
      { id: 'queens-gambit', title: "The Queen's Gambit", year: 2020, kind: 'series' },
    ])
  })
})

describe('readTopPicks', () => {
  it('reads id, title, year and kind and skips malformed items', () => {
    expect(
      readTopPicks({
        items: [
          { id: 'tp-shawshank', kind: 'movie', title: 'The Shawshank Redemption', year: 1994 },
          { id: 'tp-bad', title: 'No year' },
          { id: 'tp-bluey', kind: 'series', title: 'Bluey', year: 2018 },
        ],
      }),
    ).toEqual([
      { id: 'tp-shawshank', title: 'The Shawshank Redemption', year: 1994, kind: 'movie' },
      { id: 'tp-bluey', title: 'Bluey', year: 2018, kind: 'series' },
    ])
    expect(readTopPicks(null)).toEqual([])
  })
})

describe('labelQuery', () => {
  it('matches English and multilingual labels as safely quoted literals', () => {
    const query = labelQuery(['The Queen\'s Gambit', 'Say "hi"', 'The Queen\'s Gambit'])
    expect(query).toContain(`"The Queen's Gambit"@en`)
    expect(query).toContain(`"The Queen's Gambit"@mul`)
    expect(query).toContain('"Say \\"hi\\""@en')
    expect(query.match(/Queen's Gambit"@en/g)).toHaveLength(1)
  })
})

describe('pickMatches', () => {
  const rows = [
    { id: 'drishyam', title: 'Drishyam', year: 2013, kind: 'movie' },
    { id: 'minnal-murali', title: 'Minnal Murali', year: 2021, kind: 'movie' },
    { id: 'premam', title: 'Premam', year: 2015, kind: 'movie' },
  ]

  it('accepts only an exact title with the same year', () => {
    const bindings = [
      { item: uri('Q1'), label: lit('Drishyam'), years: lit('2013 2014') },
      { item: uri('Q2'), label: lit('Drishyam'), years: lit('2015') },
      { item: uri('Q3'), label: lit('Minnal Murali'), years: lit('2020') },
    ]
    expect([...pickMatches(rows, bindings)]).toEqual([['drishyam', 'Q1']])
  })

  it('skips titles where two items share the title and year', () => {
    const bindings = [
      { item: uri('Q10'), label: lit('Premam'), years: lit('2015') },
      { item: uri('Q11'), label: lit('Premam'), years: lit('2015') },
    ]
    expect(pickMatches(rows, bindings).has('premam')).toBe(false)
  })

  it('merges label and alias rows for the same item', () => {
    const bindings = [
      { item: uri('Q20'), label: lit('Premam'), years: lit('2016') },
      { item: uri('Q20'), label: lit('Premam'), years: lit('2015') },
    ]
    expect(pickMatches(rows, bindings).get('premam')).toBe('Q20')
  })
})

describe('watchIdsQuery', () => {
  it('asks only for the listed items and official ID properties, without deprecated values', () => {
    const query = watchIdsQuery(['Q1', 'Q2', 'Q1'])
    expect(query).toContain('VALUES ?item { wd:Q1 wd:Q2 }')
    expect(query).toContain('("P1874" p:P1874 ps:P1874)')
    expect(query).toContain('("P11049" p:P11049 ps:P11049)')
    expect(query).not.toContain('P1651')
    expect(query).toContain('DeprecatedRank')
  })
})

describe('toWatchIds', () => {
  it('maps Wikidata properties to platform ids and drops malformed values', () => {
    const ids = toWatchIds([
      idRow('Q1', 'P1874', '81497215'),
      idRow('Q1', 'P14462', GTI),
      idRow('Q1', 'P11049', '1260023113'),
      idRow('Q1', 'P9586', 'umc.cmc.6q5hghncsr2uqdm6qpt6vbnps'),
      idRow('Q2', 'P9751', 'umc.cmc.51tonxqwh6310w384ht2y3772'),
      idRow('Q2', 'P9465', '1700000084'),
      idRow('Q3', 'P1874', 'javascript:alert(1)'),
      idRow('Q3', 'P14462', 'B01MSPI8JN'),
      idRow('Q3', 'P9999', '123456'),
    ])
    expect(ids.get('Q1')).toEqual({
      netflix: '81497215',
      prime: GTI,
      hotstar: '1260023113',
      appletv: 'movie/umc.cmc.6q5hghncsr2uqdm6qpt6vbnps',
    })
    expect(ids.get('Q2')).toEqual({ appletv: 'show/umc.cmc.51tonxqwh6310w384ht2y3772', sonyliv: '1700000084' })
    expect(ids.has('Q3')).toBe(false)
  })

  it('prefers the preferred-rank value, then a stable order', () => {
    const ids = toWatchIds([idRow('Q1', 'P1874', '80000002'), idRow('Q1', 'P1874', '80000009', 'PreferredRank')])
    expect(ids.get('Q1')).toEqual({ netflix: '80000009' })
    const stable = toWatchIds([idRow('Q1', 'P1874', '80000009'), idRow('Q1', 'P1874', '80000002')])
    expect(stable.get('Q1')).toEqual({ netflix: '80000002' })
  })
})

describe('buildWatchIdsFile', () => {
  it('keeps only matched titles with at least one ID, sorted by catalog id', () => {
    const rows = [
      { id: 'b-movie', title: 'B', year: 2020, kind: 'movie' },
      { id: 'a-movie', title: 'A', year: 2019, kind: 'movie' },
      { id: 'c-movie', title: 'C', year: 2018, kind: 'movie' },
    ]
    const matches = new Map([
      ['b-movie', 'Q2'],
      ['a-movie', 'Q1'],
      ['c-movie', 'Q3'],
    ])
    const ids = new Map([
      ['Q1', { netflix: '80000001' }],
      ['Q2', { netflix: '80000002', hotstar: '1260023113' }],
      ['Q3', {}],
    ])
    const file = buildWatchIdsFile(rows, matches, ids)
    expect(Object.keys(file.titles)).toEqual(['a-movie', 'b-movie'])
    expect(file.titles['a-movie']).toEqual({ title: 'A', year: 2019, qid: 'Q1', ids: { netflix: '80000001' } })
    expect(countByPlatform(file)).toEqual({ netflix: 2, hotstar: 1 })
  })
})

describe('Wikidata requests', () => {
  it('posts the query with a descriptive User-Agent and returns bindings', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ results: { bindings: [{ a: 1 }] } }) }))
    await expect(sparql('SELECT 1', fetchImpl)).resolves.toEqual([{ a: 1 }])
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://query.wikidata.org/sparql')
    expect(init.method).toBe('POST')
    expect(init.headers['user-agent']).toMatch(/^WillowWatchIds\//)
    expect(init.body).toContain(encodeURIComponent('SELECT 1'))
  })

  it('fails loudly on an HTTP error so the previous file is kept', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 429 }))
    await expect(sparql('SELECT 1', fetchImpl)).rejects.toThrow('Wikidata HTTP 429')
  })

  it('matches the catalog and fetches IDs through the injected query function', async () => {
    const rows = [{ id: 'minnal-murali', title: 'Minnal Murali', year: 2021, kind: 'movie' }]
    const query = vi.fn(async (text) =>
      text.includes('rdfs:label')
        ? [{ item: uri('Q95432716'), label: lit('Minnal Murali'), years: lit('2021') }]
        : [idRow('Q95432716', 'P1874', '81497215')],
    )
    const matches = await matchCatalog(rows, query)
    expect(matches.get('minnal-murali')).toBe('Q95432716')
    const ids = await fetchWatchIds([...matches.values()], query)
    expect(ids.get('Q95432716')).toEqual({ netflix: '81497215' })
    expect(query).toHaveBeenCalledTimes(2)
  })
})
