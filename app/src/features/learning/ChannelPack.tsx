import { useQuery } from '@tanstack/react-query'
import { Check, ExternalLink, ShieldAlert, Tv } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { apiPost } from '../../api/client'
import { Badge, Button, Field, inputClass } from '../../components/ui'
import { LEARNING_INTERESTS } from '../../data/learning-channels'
import { childName } from '../../lib'
import { useStore } from '../../store'
import type { AgeBand, Child, LearningInterest } from '../../types'
import { BAND_SAMPLE_AGE, getPackByAgeBand } from './learningPacks'
import { inputFromChild, recommend } from './recommend'
import { ageBandSchema, recommendationOutputSchema } from './schema'

const BANDS: AgeBand[] = ['2-5', '5-8', '8-12']

function youtubeKidsUrl(channelUrl: string) {
  return `https://www.youtubekids.com/?utm_source=willow&target=${encodeURIComponent(channelUrl)}`
}

export function ChannelPack({ kids }: { kids: Child[] }) {
  const { t } = useTranslation()
  const { state, logAudit } = useStore()
  const [params, setParams] = useSearchParams()
  const bandFromUrl = ageBandSchema.safeParse(params.get('band'))
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const child = kids.find((c) => c.id === childId) ?? kids[0]
  const [interests, setInterests] = useState<LearningInterest[]>(() =>
    child ? inputFromChild(child).interests : ['stories'],
  )
  const [copied, setCopied] = useState(false)
  const bandOverride = bandFromUrl.success ? bandFromUrl.data : null

  const input = useMemo(() => {
    if (bandOverride) {
      const pack = getPackByAgeBand(bandOverride)
      return {
        childId: child?.id,
        childName: child ? childName(child) : pack?.label,
        ageYears: BAND_SAMPLE_AGE[bandOverride],
        stage: child?.stage,
        interests,
        allergies: child?.allergies.map((a) => a.name) ?? [],
        countryCode: state.countryCode,
      }
    }
    if (!child) return null
    return { ...inputFromChild(child, state.countryCode), interests }
  }, [bandOverride, child, interests, state.countryCode])

  const fallback = input ? recommend(input) : null
  const { data } = useQuery({
    queryKey: ['recommendations', input],
    enabled: Boolean(input),
    queryFn: async () => {
      if (!input) return null
      try {
        return await apiPost('/recommendations', input, recommendationOutputSchema)
      } catch {
        return recommend(input)
      }
    },
  })
  const result = data ?? fallback

  if (!result) {
    return (
      <div className="card p-5">
        <p className="text-sm text-muted">{t('learning.empty')}</p>
      </div>
    )
  }

  function toggle(interest: LearningInterest) {
    setInterests((curr) =>
      curr.includes(interest) ? curr.filter((i) => i !== interest) : [...curr, interest],
    )
  }

  function setBand(next: AgeBand | null) {
    const copy = new URLSearchParams(params)
    if (next) copy.set('band', next)
    else copy.delete('band')
    setParams(copy, { replace: true })
  }

  async function copyJson() {
    if (!result || !child) return
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    logAudit('learning.recommend', `${childName(child)} · ${result.ageBand}`)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const names = result.channels.map((c) => c.name)
  const unique = new Set(names).size === names.length

  return (
    <section className="mt-10" data-testid="channel-pack">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t('learning.channelsTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('learning.channelsSubtitle')}</p>
        </div>
        <span data-testid="age-band">
          <Badge tone="pine">Ages {result.ageBand}</Badge>
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Age band">
        <button
          type="button"
          role="tab"
          aria-selected={!bandOverride}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${!bandOverride ? 'bg-pine text-white' : 'border border-line'}`}
          onClick={() => setBand(null)}
        >
          From child
        </button>
        {BANDS.map((band) => (
          <button
            key={band}
            type="button"
            role="tab"
            data-testid={`band-tab-${band}`}
            aria-selected={bandOverride === band}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              bandOverride === band ? 'bg-pine text-white' : 'border border-line'
            }`}
            onClick={() => setBand(band)}
          >
            {band}
          </button>
        ))}
      </div>

      <div className="card mb-5 grid gap-4 p-4 md:grid-cols-2">
        <Field label={t('learning.pickChild')}>
          <select
            className={inputClass}
            value={child?.id ?? ''}
            onChange={(e) => {
              const next = kids.find((k) => k.id === e.target.value)
              setChildId(e.target.value)
              if (next) setInterests(inputFromChild(next).interests)
            }}
          >
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {childName(k)}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">{t('learning.interests')}</p>
          <div className="flex flex-wrap gap-2">
            {LEARNING_INTERESTS.map((interest) => {
              const on = interests.includes(interest)
              return (
                <button
                  key={interest}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    on ? 'bg-pine text-white' : 'border border-line bg-paper text-muted'
                  }`}
                  aria-pressed={on}
                  onClick={() => toggle(interest)}
                >
                  {interest}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {result.anekalTip ? (
        <p className="mb-4 rounded-2xl border border-pine/20 bg-pine-soft px-4 py-3 text-sm text-pine">{result.anekalTip}</p>
      ) : null}

      <div className="mb-5 rounded-2xl border border-clay/25 bg-clay-soft px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldAlert size={16} /> {t('learning.safeguards')}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {result.safeguards.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      {!unique ? <p className="mb-3 text-sm text-rose">Duplicate channels in this pack.</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.channels.map((channel) => (
          <article key={channel.id} className="card flex flex-col p-4" data-testid="channel-card" data-channel-id={channel.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{channel.name}</p>
                <p className="text-xs text-muted">{channel.handle}</p>
              </div>
              <Tv size={18} className="text-clay" aria-hidden />
            </div>
            <p className="mt-2 flex-1 text-sm text-muted">{channel.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {channel.youtubeKids ? <Badge tone="pine">{t('learning.youtubeKids')}</Badge> : null}
              {channel.adLight ? <Badge tone="pine">{t('learning.adLight')}</Badge> : <Badge tone="sand">Check ads</Badge>}
              {channel.interests.slice(0, 3).map((i) => (
                <Badge key={i} tone="sand">
                  {i}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-pine">
              {t('learning.coView')}: {channel.coViewingTip}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                className="inline-flex items-center gap-1 rounded-xl bg-pine px-3 py-2 text-xs font-semibold text-white"
                href={`${channel.youtubeUrl}?autoplay=0`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('learning.openChannel')} <ExternalLink size={12} />
              </a>
              {channel.playlistUrl ? (
                <a
                  className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-xs font-semibold"
                  href={`${channel.playlistUrl}?autoplay=0`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('learning.openPlaylist')}
                </a>
              ) : null}
              {channel.youtubeKids ? (
                <a
                  className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-xs font-semibold"
                  href={youtubeKidsUrl(channel.youtubeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kids app
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" variant="soft" onClick={() => void copyJson()}>
          {copied ? (
            <>
              <Check size={16} /> {t('learning.copied')}
            </>
          ) : (
            t('learning.copyJson')
          )}
        </Button>
        <p className="text-xs text-muted">
          {result.playlist.length} playlist links · schema in src/data/learning-packs.schema.json
        </p>
      </div>
    </section>
  )
}
