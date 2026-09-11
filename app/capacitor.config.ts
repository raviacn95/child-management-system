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
  config.server = { url: LIVE_SITE, androidScheme: 'https' }
}

export default config
