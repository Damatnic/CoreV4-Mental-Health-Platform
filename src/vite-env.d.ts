/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_RETRY_ATTEMPTS: string
  readonly VITE_AUTH_DOMAIN: string
  readonly VITE_AUTH_CLIENT_ID: string
  readonly VITE_AUTH_REDIRECT_URI: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENVIRONMENT: string
  readonly VITE_GA_TRACKING_ID: string
  readonly VITE_MIXPANEL_TOKEN: string
  readonly VITE_FEATURE_CRISIS_CHAT: string
  readonly VITE_FEATURE_AI_THERAPIST: string
  readonly VITE_FEATURE_COMMUNITY: string
  readonly VITE_FEATURE_PROFESSIONAL_MATCHING: string
  readonly VITE_FEATURE_WELLNESS_TRACKING: string
  readonly VITE_CRISIS_HOTLINE: string
  readonly VITE_CRISIS_TEXT_LINE: string
  readonly VITE_EMERGENCY_NUMBER: string
  readonly VITE_WS_URL: string
  readonly VITE_WS_RECONNECT_INTERVAL: string
  readonly VITE_STORAGE_PREFIX: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_ENCRYPTION_KEY: string
  readonly VITE_CSP_REPORT_URI: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_TWILIO_ACCOUNT_SID: string
  readonly VITE_TWILIO_AUTH_TOKEN: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_DEV_TOOLS: string
  readonly VITE_MOCK_API: string
  readonly VITE_LOG_LEVEL: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}