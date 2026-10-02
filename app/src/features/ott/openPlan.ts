import { opensAppByLink } from './deepLink'

/** Appended to the WebView user agent by app shells whose MainActivity launches `intent://` links. */
export const NATIVE_INTENT_MARKER = 'WillowIntents/1'

export type OpenMode = 'embed' | 'new-tab' | 'navigate'

export type OpenPlan = { mode: OpenMode; href: string }

export type OpenEnv = {
  tv: boolean
  native: boolean
  ua: string
  origin?: string
}

export type ParsedIntent = { pkg?: string; target: string; fallback?: string; launch?: boolean; appName?: string }

const FIRE_TV_UA = /\bAFT[A-Z0-9]/
const ANDROID_UA = /Android/i
const EMBED_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'])

function httpsOnly(href: string | undefined) {
  if (!href) return ''
  try {
    return new URL(href).protocol === 'https:' ? href : ''
  } catch {
    return ''
  }
}

function safeAppName(value: string) {
  let decoded = ''
  try {
    decoded = decodeURIComponent(value).trim()
  } catch {
    return undefined
  }
  if (decoded.length === 0 || decoded.length > 30 || !/^[\p{L}\p{N} .&+'’-]+$/u.test(decoded)) return undefined
  return decoded
}

export function parseIntent(href: string): ParsedIntent | null {
  if (!href.startsWith('intent:')) return null
  const at = href.indexOf('#Intent;')
  if (at < 0) return null
  const head = href.slice('intent:'.length, at)
  let scheme = ''
  let pkg: string | undefined
  let fallback: string | undefined
  let main = false
  let launcher = false
  let appName: string | undefined
  for (const part of href.slice(at + '#Intent;'.length).split(';')) {
    if (part === 'end') break
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq)
    const value = part.slice(eq + 1)
    if (key === 'scheme') scheme = value
    else if (key === 'package') pkg = /^[A-Za-z][\w.]*$/.test(value) ? value : undefined
    else if (key === 'action' && value === 'android.intent.action.MAIN') main = true
    else if (key === 'category' && value === 'android.intent.category.LAUNCHER') launcher = true
    else if (key === 'S.app_name') appName = safeAppName(value)
    else if (key === 'S.browser_fallback_url') {
      try {
        fallback = decodeURIComponent(value)
      } catch {
        fallback = undefined
      }
    }
  }
  if (main && launcher && !scheme && (pkg || appName)) {
    return { ...(pkg ? { pkg } : {}), target: '', launch: true, ...(appName ? { appName } : {}) }
  }
  if (!scheme || !head.startsWith('//')) return null
  return { pkg, target: `${scheme}:${head}`, fallback }
}

/** Frames only sources known to allow embedding; storefronts (Netflix, Prime, JioHotstar…) refuse to be framed. */
export function canEmbed(url: string, origin?: string) {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (origin && parsed.origin === origin) return true
  if (parsed.protocol !== 'https:' || !EMBED_HOSTS.has(parsed.hostname)) return false
  return parsed.pathname === '/embed' || parsed.pathname.startsWith('/embed/')
}

function toIntent(web: string) {
  const u = new URL(web)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(web)};end`
}

function storeHref(pkg: string, ua: string) {
  return FIRE_TV_UA.test(ua) ? `amzn://apps/android?p=${pkg}` : `market://details?id=${pkg}`
}

/**
 * Shells built before NATIVE_INTENT_MARKER list `*.netflix.com`-style hosts in Capacitor allowNavigation, which keeps
 * them inside the WebView. Capacitor hands any other host to Android, so the bare domain opens the app or browser.
 */
function outsideOldShell(web: string) {
  const u = new URL(web)
  const labels = u.hostname.split('.')
  if (labels.length === 3 && labels[0] === 'www') u.hostname = labels.slice(1).join('.')
  return u.toString()
}

function nativePlan(url: string, intent: ParsedIntent | null, web: string, env: OpenEnv): OpenPlan | null {
  if (env.ua.includes(NATIVE_INTENT_MARKER)) {
    if (intent) return { mode: 'navigate', href: url }
    return web ? { mode: 'navigate', href: toIntent(web) } : null
  }
  if (env.tv && intent?.pkg && opensAppByLink(intent.target)) return { mode: 'navigate', href: outsideOldShell(intent.target) }
  if (env.tv && intent?.pkg) return { mode: 'navigate', href: storeHref(intent.pkg, env.ua) }
  return web ? { mode: 'navigate', href: outsideOldShell(web) } : null
}

export function openPlan({ url, ...env }: OpenEnv & { url: string }): OpenPlan | null {
  if (!url) return null
  const intent = parseIntent(url)
  if (intent?.launch && (intent.pkg || intent.appName)) {
    if (env.native || ANDROID_UA.test(env.ua)) return { mode: 'navigate', href: url }
    return null
  }
  if (intent && !httpsOnly(intent.target)) return null
  const web = httpsOnly(intent ? intent.fallback || intent.target : url)
  if (!intent && !web) return null
  if (!env.tv && web && canEmbed(web, env.origin)) return { mode: 'embed', href: web }
  if (env.native) return nativePlan(url, intent, web, env)
  if (intent && ANDROID_UA.test(env.ua)) return { mode: 'navigate', href: url }
  return web ? { mode: 'new-tab', href: web } : null
}
