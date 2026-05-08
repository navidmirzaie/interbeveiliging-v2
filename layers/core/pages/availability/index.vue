<script lang="ts" setup>
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const toast = useToast()

const { data, refresh } = await useFetch('/api/profile/availability', {
  headers: useRequestHeaders(['cookie']),
})

const contractHoursPerPeriod = computed(() => data.value?.contractHoursPerPeriod ?? 144)

const availability = ref<number[]>(Array(7).fill(8))

watch(data, (val) => {
  if (!val) return
  const filled = Array(7).fill(0) as number[]
  for (const a of val.availability) {
    filled[a.dayOfWeek] = a.maxHours
  }
  const hasAny = val.availability.length > 0
  availability.value = hasAny ? filled : Array(7).fill(8)
}, { immediate: true })

const saving = ref(false)
const saved = ref(false)

async function handleSave() {
  saving.value = true
  saved.value = false
  try {
    await $fetch('/api/profile/availability', {
      method: 'PUT',
      body: {
        availability: availability.value.map((maxHours, dayOfWeek) => ({ dayOfWeek, maxHours })),
      },
    })
    saved.value = true
    toast.add({ title: 'Beschikbaarheid opgeslagen', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Opslaan mislukt', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="availability">
    <template #header>
      <UDashboardNavbar title="Mijn beschikbaarheid">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-xl">
        <p class="text-sm text-muted mb-6">
          Geef per dag aan hoeveel uur u beschikbaar bent. De planner gebruikt dit bij het inplannen.
        </p>

        <UCard class="mb-4">
          <EmployeeFormAvailabilityTable
            v-model="availability"
            :contract-hours-per-period="contractHoursPerPeriod"
          />

          <template #footer>
            <div class="flex justify-end">
              <UButton color="primary" :loading="saving" @click="handleSave">
                Beschikbaarheid opslaan
              </UButton>
            </div>
          </template>
        </UCard>

        <UAlert
          icon="i-lucide-info"
          color="neutral"
          variant="outline"
          :description="`Contracturen per periode: ${contractHoursPerPeriod} uur — Dit is vastgelegd door uw werkgever en kan niet worden gewijzigd.`"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
