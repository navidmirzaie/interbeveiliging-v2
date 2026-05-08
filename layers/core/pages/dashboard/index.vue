<script lang="ts" setup>
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const authStore = useAuthStore()
useTenantTheme()

const { data: stats } = await useFetch('/api/dashboard/stats', {
  headers: useRequestHeaders(['cookie']),
})

const title = computed(() =>
  authStore.organisation?.dashboardTitle || 'Dashboard',
)

const statCards = computed(() => [
  {
    label: 'Medewerkers',
    value: stats.value?.totalEmployees ?? 0,
    icon: 'i-lucide-users',
    to: '/employees',
  },
  {
    label: 'Diensten deze week',
    value: stats.value?.shiftsThisWeek ?? 0,
    icon: 'i-lucide-calendar',
    to: '/schedule',
  },
  {
    label: 'Diensten vandaag',
    value: stats.value?.shiftsToday ?? 0,
    icon: 'i-lucide-clock',
    to: '/schedule',
  },
])
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-3 gap-4 mb-8">
        <NuxtLink
          v-for="card in statCards"
          :key="card.label"
          :to="card.to"
          class="no-underline"
        >
          <UCard class="stat-card">
            <div class="flex items-center gap-4">
              <div class="size-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <UIcon :name="card.icon" class="size-5 text-primary" />
              </div>
              <div>
                <div class="text-2xl font-bold">{{ card.value }}</div>
                <div class="text-xs text-muted mt-0.5">{{ card.label }}</div>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <UCard>
        <template #header>
          <p class="text-sm font-semibold">Snelkoppelingen</p>
        </template>
        <div class="flex gap-3 flex-wrap">
          <UButton v-if="authStore.canPlan" to="/employees" variant="outline" icon="i-lucide-user-plus">
            Medewerker toevoegen
          </UButton>
          <UButton :to="authStore.isEmployee ? '/schedule/my' : '/schedule'" variant="outline" icon="i-lucide-calendar-plus">
            Rooster openen
          </UButton>
          <UButton v-if="authStore.canPlan" to="/settings" variant="outline" icon="i-lucide-settings">
            Instellingen
          </UButton>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

<style>
.stat-card:hover {
  box-shadow: var(--shadow-md) !important;
}
</style>
