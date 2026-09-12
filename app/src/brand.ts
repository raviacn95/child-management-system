export const BRAND = 'Willow'
export const BRAND_MARK = 'Willow™'
export const BRAND_TAGLINE = 'Family growth OS — care, learning, and parent development.'
export const COPYRIGHT_YEAR = 2026
export const RIGHTS_HOLDER = 'the repository rights holder'
export const LIVE_SITE = 'https://raviacn95.github.io/child-management-system/'

export const COPYRIGHT_LINE = `© ${COPYRIGHT_YEAR} ${BRAND_MARK}. All rights reserved. The complete repository is proprietary to ${RIGHTS_HOLDER}.`

export const TRADEMARK_NOTICE =
  `${BRAND_MARK} and the Willow marks, design tokens, catalogs, and source are exclusive property of ${RIGHTS_HOLDER}. ` +
  'Third-party names (WhatsApp, Facebook, YouTube, Prime Video, and others) belong to their owners and appear only as official outbound links. Willow is not affiliated with those companies.'

export function shareCopy(url = LIVE_SITE) {
  return [
    `${BRAND_MARK} — ${BRAND_TAGLINE}`,
    'Install the live app for Windows, Android, and Fire Stick.',
    url,
    COPYRIGHT_LINE,
  ].join('\n')
}
