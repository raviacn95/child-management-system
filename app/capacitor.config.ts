import type { CapacitorConfig } from '@capacitor/cli'

const LIVE_SITE = 'https://raviacn95.github.io/child-management-system/'

const config: CapacitorConfig = {
  appId: 'care.willow.childcare',
  appName: 'Willow',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

if (process.env.WILLOW_LIVE_SHELL === '1') {
  config.server = {
    url: `${LIVE_SITE}?v=toppicks1`,
    androidScheme: 'https',
    allowNavigation: [
      'raviacn95.github.io',
      '*.jiohotstar.com',
      '*.hotstar.com',
      '*.primevideo.com',
      '*.netflix.com',
      '*.sonyliv.com',
      '*.zee5.com',
      '*.youtube.com',
      '*.google.com',
      '*.apple.com',
      '*.justwatch.com',
    ],
  }
}

export default config
