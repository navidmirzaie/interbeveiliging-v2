<script lang="ts" setup>
const authStore = useAuthStore()

await callOnce('auth:session', () => authStore.fetchSession())

if (import.meta.client && !authStore.user) {
  await authStore.fetchSession()
}

const navItems = computed(() => {
  if (authStore.isEmployee) {
    return [
      { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
      { label: 'Mijn rooster', to: '/schedule/my', icon: 'i-lucide-calendar' },
      { label: 'Beschikbaarheid', to: '/availability', icon: 'i-lucide-clock' },
    ]
  }
  return [
    { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
    { label: 'Medewerkers', to: '/employees', icon: 'i-lucide-users' },
    { label: 'Rooster', to: '/schedule', icon: 'i-lucide-calendar' },
    { label: 'Instellingen', to: '/settings', icon: 'i-lucide-settings' },
  ]
})

const supabase = useSupabaseClient()

async function signOut() {
  await supabase.auth.signOut()
  authStore.clear()
  await navigateTo('/auth/login')
}

const userMenuItems = computed(() => [[
  {
    label: authStore.user?.email ?? '',
    slot: 'account',
    disabled: true,
  },
], [
  {
    label: 'Uitloggen',
    icon: 'i-lucide-log-out',
    color: 'error' as const,
    onSelect: signOut,
  },
]] satisfies import('@nuxt/ui').DropdownMenuItem[][])

const displayName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return `${u.firstName} ${u.lastName}`.trim()
})
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible class="main-nav-sidebar">
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2.5 min-w-0 px-1">
          <img
            v-if="authStore.organisation?.logoUrl"
            :src="authStore.organisation.logoUrl"
            class="size-7 rounded object-contain shrink-0"
            :alt="authStore.organisation.name"
          />
          <UIcon v-else name="i-lucide-shield" class="size-5 shrink-0 text-primary" />
          <span v-if="!collapsed" class="font-bold text-sm truncate">
            {{ authStore.organisation?.name ?? 'InterBeveiliging' }}
          </span>
        </div>
      </template>

      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        class="px-1"
        :ui="{ link: 'text-[15px]' }"
      />

      <template #footer="{ collapsed }">
        <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'top-start' }">
          <button
            class="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-elevated transition-colors min-w-0"
            :class="collapsed ? 'justify-center' : ''"
          >
            <div class="size-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-semibold text-xs">
              {{ displayName.slice(0, 2).toUpperCase() || '?' }}
            </div>
            <template v-if="!collapsed">
              <div class="flex-1 min-w-0 text-left">
                <div class="text-sm font-medium truncate leading-tight">{{ displayName }}</div>
                <div class="text-xs text-muted truncate leading-tight">{{ authStore.user?.email }}</div>
              </div>
              <UIcon name="i-lucide-chevrons-up-down" class="size-4 text-muted shrink-0" />
            </template>
          </button>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

<style>
/* Fixed 250 px — the component uses an inline-style CSS variable (percentage-based),
   so we override the computed width with a targeted rule on the non-collapsed state. */
.main-nav-sidebar[data-collapsed="false"] {
  width: 250px !important;
}
</style>
