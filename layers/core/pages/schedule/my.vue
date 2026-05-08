<script lang="ts" setup>
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

function isoWeekToMonday(week: string): Date {
  const [year, w] = week.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7)
  return monday
}

function dateToISOWeek(d: Date): string {
  const tmp = new Date(d)
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
  const week1 = new Date(tmp.getFullYear(), 0, 4)
  const week = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`
}

const now = new Date()
const selectedWeek = ref(dateToISOWeek(now))

const monday = computed(() => isoWeekToMonday(selectedWeek.value))
const weekDates = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.value)
    d.setDate(monday.value.getDate() + i)
    return d.toISOString().slice(0, 10)
  }),
)
const weekDateLabels = computed(() =>
  weekDates.value.map(d => {
    const [, , day] = d.split('-')
    return `${parseInt(day)} ${['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][new Date(d).getMonth()]}`
  }),
)

const currentWeek = dateToISOWeek(now)

const { data: shiftsData, refresh } = await useFetch(
  () => `/api/shifts/my?week=${selectedWeek.value}`,
  { headers: useRequestHeaders(['cookie']) },
)

const shifts = computed(() => shiftsData.value?.shifts ?? [])

watch(selectedWeek, () => refresh())

function prevWeek() {
  const d = isoWeekToMonday(selectedWeek.value)
  d.setDate(d.getDate() - 7)
  selectedWeek.value = dateToISOWeek(d)
}

function nextWeek() {
  const d = isoWeekToMonday(selectedWeek.value)
  d.setDate(d.getDate() + 7)
  selectedWeek.value = dateToISOWeek(d)
}
</script>

<template>
  <UDashboardPanel id="my-schedule">
    <template #header>
      <UDashboardNavbar title="Mijn rooster">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UBadge color="neutral" variant="outline" icon="i-lucide-eye">
            Alleen leesbaar
          </UBadge>
          <div class="flex items-center gap-1">
            <UButton variant="ghost" icon="i-lucide-chevron-left" size="sm" @click="prevWeek" />
            <span class="text-sm font-semibold min-w-36 text-center">
              Week {{ selectedWeek.split('-W')[1] }} · {{ selectedWeek.split('-W')[0] }}
            </span>
            <UButton variant="ghost" icon="i-lucide-chevron-right" size="sm" @click="nextWeek" />
          </div>
          <UButton
            v-if="selectedWeek !== currentWeek"
            variant="ghost"
            size="sm"
            icon="i-lucide-calendar-check"
            @click="selectedWeek = currentWeek"
          >
            Huidige week
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="!shifts.length" class="flex items-center justify-center py-16 text-sm text-muted">
        Geen diensten gepland voor deze week
      </div>

      <div v-else style="background: var(--c-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden">
        <table style="width: 100%; border-collapse: collapse">
          <thead>
            <tr style="border-bottom: 1px solid var(--c-border)">
              <th v-for="(label, i) in DAY_LABELS" :key="label" style="padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); text-align: left">
                {{ label }}<br>
                <span style="font-weight: 400; font-size: 11px; text-transform: none; letter-spacing: 0">{{ weekDateLabels[i] }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="(date, i) in weekDates" :key="date" style="padding: 12px 16px; vertical-align: top; border-right: 1px solid var(--c-border)">
                <div class="flex flex-col gap-2">
                  <div
                    v-for="shift in shifts.filter(s => s.date === date)"
                    :key="shift.id"
                    class="shift-block published"
                  >
                    <span class="shift-time">{{ shift.startTime.slice(0,5) }}–{{ shift.endTime.slice(0,5) }}</span>
                    <span v-if="shift.locationLabel" class="shift-location">{{ shift.locationLabel }}</span>
                  </div>
                  <span v-if="!shifts.some(s => s.date === date)" style="font-size: 12px; color: var(--c-muted)">—</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </UDashboardPanel>
</template>
