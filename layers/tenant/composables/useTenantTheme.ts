import { generateColorScale } from '../utils/colorScale'

function injectScale(name: string, hex: string) {
  const scale = generateColorScale(hex)
  for (const [shade, value] of Object.entries(scale)) {
    // Target --ui-color-* so both Nuxt UI components (which read --ui-color-* / --ui-*)
    // and Tailwind utilities (which read --color-* → --ui-color-* via @theme default inline)
    // pick up the change immediately.
    document.documentElement.style.setProperty(`--ui-color-${name}-${shade}`, value)
  }
}

export function useTenantTheme() {
  const authStore = useAuthStore()

  function applyTheme(org = authStore.organisation) {
    if (!import.meta.client || !org) return

    injectScale('primary', org.primaryColour ?? '#1E3A5F')

    if (org.logoUrl) {
      document.documentElement.style.setProperty('--org-logo-url', `url("${org.logoUrl}")`)
    } else {
      document.documentElement.style.removeProperty('--org-logo-url')
    }
  }

  function applyPreview(colours: { primary?: string }) {
    if (!import.meta.client) return
    if (colours.primary) injectScale('primary', colours.primary)
  }

  watch(() => authStore.organisation, applyTheme, { immediate: true })

  return { applyTheme, applyPreview }
}
