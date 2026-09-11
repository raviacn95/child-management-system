/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_API_URL?: string
  readonly VITE_ENABLE_PWA?: string
  readonly VITE_ENABLE_MSW?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_FEATURE_LEARNING_CHANNELS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
