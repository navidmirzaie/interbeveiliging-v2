import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local before config is evaluated so process.env is populated
try {
  const envFile = readFileSync(resolve(__dirname, '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && !process.env[key]) process.env[key] = value
  }
} catch {}

export default defineNuxtConfig({
  srcDir: 'app/',

  extends: [
    './layers/base',
    './layers/ui',
    './layers/core',
    './layers/tenant',
  ],

  // @nuxt/ui v4 auto-registers @nuxt/icon, @nuxt/fonts, @nuxtjs/color-mode — do not add them here
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],

  imports: {
    presets: [
      {
        from: 'pinia',
        imports: ['defineStore', 'storeToRefs', 'acceptHMRUpdate', 'skipHydrate'],
      },
    ],
  },

  css: ['~/assets/css/main.css'],

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redirectOptions: {
      login: '/auth/login',
      callback: '/confirm',
      exclude: ['/**'],
    },
  },

  routeRules: {
    '/auth/**':         { ssr: false },
    '/schedule/**':     { ssr: false },
    '/schedule':        { ssr: false },
    '/settings/**':     { ssr: false },
    '/dashboard':       { ssr: false },
    '/employees/**':    { ssr: false },
    '/availability/**': { ssr: false },
  },

  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromAddress: process.env.RESEND_FROM_ADDRESS,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    cronSecret: process.env.CRON_SECRET,
    platformUrl: process.env.URL ?? 'http://localhost:3000',
    supabase: {
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
      },
    },
  },

  compatibilityDate: '2025-01-01',
})
