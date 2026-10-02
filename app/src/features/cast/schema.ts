import { z } from 'zod'
import { WATCH_ID_SHAPES } from '../ott/deepLink'

export const REMOTE_KEYS = ['up', 'down', 'left', 'right', 'ok', 'back', 'home', 'willow'] as const
export type RemoteKey = (typeof REMOTE_KEYS)[number]

const NAME_MAX = 32
const b64u = (min: number, max: number) => z.string().regex(/^[A-Za-z0-9_-]+$/).min(min).max(max)
const deviceId = b64u(16, 32)
const pub = b64u(80, 100)
const sdp = z.string().min(10).max(3000)

export const deviceSchema = z.object({ id: deviceId, name: z.string().min(1).max(NAME_MAX) }).strict()

const watchIds = z
  .object({
    netflix: z.string().regex(WATCH_ID_SHAPES.netflix).optional(),
    prime: z.string().regex(WATCH_ID_SHAPES.prime).optional(),
    hotstar: z.string().regex(WATCH_ID_SHAPES.hotstar).optional(),
    appletv: z.string().regex(WATCH_ID_SHAPES.appletv).optional(),
    sonyliv: z.string().regex(WATCH_ID_SHAPES.sonyliv).optional(),
  })
  .strict()

/** Only what a TV needs to open a title or move focus: never child, PIN, account or note fields. */
export const messageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hello'), pub }).strict(),
  z.object({ type: z.literal('offer'), to: deviceId, pub }).strict(),
  z.object({ type: z.literal('approved'), to: deviceId }).strict(),
  z.object({ type: z.literal('denied'), to: deviceId }).strict(),
  z
    .object({
      type: z.literal('play'),
      title: z.string().min(1).max(120),
      year: z.number().int().min(1900).max(2100).optional(),
      lang: z.string().regex(/^[a-z]{2}$/).optional(),
      platformId: z.string().regex(/^[a-z0-9-]{2,32}$/),
      watchIds: watchIds.optional(),
    })
    .strict(),
  z.object({ type: z.literal('ack'), status: z.enum(['opening', 'failed']), title: z.string().max(120).optional() }).strict(),
  z.object({ type: z.literal('key'), key: z.enum(REMOTE_KEYS), times: z.number().int().min(1).max(9).optional() }).strict(),
  z.object({ type: z.literal('ping') }).strict(),
  z.object({ type: z.literal('status'), screen: z.string().max(40), focus: z.string().max(80).optional() }).strict(),
  z.object({ type: z.literal('rtc-offer'), sdp }).strict(),
  z.object({ type: z.literal('rtc-answer'), sdp }).strict(),
  z.object({ type: z.literal('bye') }).strict(),
])

export const envelopeSchema = z
  .object({ v: z.literal(1), ts: z.number().int(), n: b64u(16, 16), from: deviceSchema, msg: messageSchema })
  .strict()

export type Device = z.infer<typeof deviceSchema>
export type CastMessage = z.infer<typeof messageSchema>
export type PlayMessage = Extract<CastMessage, { type: 'play' }>

export function cleanName(raw: string, fallback: string) {
  const text = raw.replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim()
  return (text || fallback).slice(0, NAME_MAX)
}
