import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'care.willow.childcare',
  appName: 'Willow',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
