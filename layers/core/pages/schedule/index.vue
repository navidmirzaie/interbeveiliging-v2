<script lang="ts" setup>
import type { ShiftSuggestion, UnfillableSlot } from '../../base/types/api'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const authStore = useAuthStore()
const employeesStore = useEmployeesStore()
const scheduleStore = useScheduleStore()

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

const selectedWeek = ref(scheduleStore.selectedWeek)

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

const { data: shiftsData, refresh: refreshShifts } = await useFetch(
  () => `/api/shifts?week=${selectedWeek.value}`,
  { headers: useRequestHeaders(['cookie']) },
)

const shifts = computed(() => shiftsData.value?.shifts ?? [])
const isPublished = computed(() => shiftsData.value?.published ?? false)

await employeesStore.fetchEmployees()
const guards = computed(() => employeesStore.schedulable)

const { data: periodHoursData, refresh: refreshPeriodHours } = await useFetch(
  () => `/api/shifts/period-hours?weekStart=${weekDates.value[0]}`,
  { headers: useRequestHeaders(['cookie']) },
)
const periodHours = computed(() => periodHoursData.value?.hoursByProfile ?? {})

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

watch(selectedWeek, () => { refreshShifts(); refreshPeriodHours() })

const showWeekPicker = ref(false)
const weekPickerDate = computed({
  get: () => isoWeekToMonday(selectedWeek.value).toISOString().slice(0, 10),
  set: (dateStr: string) => {
    selectedWeek.value = dateToISOWeek(new Date(dateStr + 'T00:00:00'))
    showWeekPicker.value = false
  },
})

const toast = useToast()

const showModal = ref(false)
const editingShift = ref<(typeof shifts.value)[0] | null>(null)
const pendingGuardId = ref<string | null>(null)
const pendingDay = ref<number>(0)
const draggingEmployeeId = ref<string | null>(null)

function onShiftClick(shiftId: string) {
  editingShift.value = shifts.value.find(s => s.id === shiftId) ?? null
  showModal.value = true
}

function onShiftAdd(guardId: string, day: number) {
  editingShift.value = null
  pendingGuardId.value = guardId
  pendingDay.value = day
  showModal.value = true
}

function onGuardDropped(employeeId: string, targetGuardId: string, day: number) {
  draggingEmployeeId.value = null
  if (employeeId !== targetGuardId) {
    const droppedGuard = guards.value.find(g => g.id === employeeId)
    const targetGuard = guards.value.find(g => g.id === targetGuardId)
    toast.add({
      title: 'Verkeerde medewerker',
      description: `${droppedGuard?.firstName ?? 'Medewerker'} kan niet worden ingepland op de rij van ${targetGuard?.firstName ?? 'een andere medewerker'}.`,
      color: 'error',
    })
    return
  }
  editingShift.value = null
  pendingGuardId.value = employeeId
  pendingDay.value = day
  showModal.value = true
}

async function handleSaved(form: { profileId: string; date: string; startTime: string; endTime: string; locationLabel: string }) {
  if (editingShift.value) {
    await $fetch(`/api/shifts/${editingShift.value.id}`, { method: 'PATCH', body: form })
  } else {
    await $fetch('/api/shifts', { method: 'POST', body: form })
  }
  showModal.value = false
  editingShift.value = null
  pendingGuardId.value = null
  await Promise.all([refreshShifts(), refreshPeriodHours()])
}

async function handleDeleted(id: string) {
  await $fetch(`/api/shifts/${id}`, { method: 'DELETE' })
  showModal.value = false
  editingShift.value = null
  await Promise.all([refreshShifts(), refreshPeriodHours()])
}

async function togglePublish() {
  const published = !isPublished.value
  await $fetch('/api/shifts/publish', {
    method: 'PATCH',
    body: { week: selectedWeek.value, published },
  })
  await refreshShifts()
}

const showAutoPlan = ref(false)
const autoPlanLoading = ref(false)
const autoPlanSuggestions = ref<ShiftSuggestion[]>([])
const autoPlanUnfillable = ref<UnfillableSlot[]>([])

async function openAutoPlan() {
  showAutoPlan.value = true
  autoPlanLoading.value = true
  autoPlanSuggestions.value = []
  autoPlanUnfillable.value = []
  try {
    const result = await $fetch<{ suggestions: ShiftSuggestion[]; unfillable: UnfillableSlot[] }>(
      '/api/schedule/auto-plan',
      { method: 'POST', body: { weekStart: weekDates.value[0] } },
    )
    autoPlanSuggestions.value = result.suggestions
    autoPlanUnfillable.value = result.unfillable
  } catch (err: unknown) {
    showAutoPlan.value = false
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Auto-plannen mislukt. Controleer de serverlog.'
    toast.add({ title: 'Auto-plan fout', description: msg, color: 'error' })
  } finally {
    autoPlanLoading.value = false
  }
}

async function handleAutoPlanConfirm(accepted: ShiftSuggestion[]) {
  await $fetch('/api/schedule/auto-plan/confirm', { method: 'POST', body: { suggestions: accepted } })
  showAutoPlan.value = false
  await refreshShifts()
}
</script>

<template>
  <!-- Left panel: employee list (resizable, like inbox list) -->
  <UDashboardPanel
    id="schedule-guards"
    :default-size="22"
    :min-size="16"
    :max-size="30"
    resizable
  >
    <UDashboardNavbar title="Medewerkers">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
      <template #trailing>
        <UBadge :label="guards.length" variant="subtle" />
      </template>
    </UDashboardNavbar>

    <GuardSidebar
      :guards="guards"
      :period-hours="periodHours"
      @drag:start="draggingEmployeeId = $event"
      @drag:end="draggingEmployeeId = null"
    />
  </UDashboardPanel>

  <!-- Right panel: week schedule grid -->
  <UDashboardPanel id="schedule-grid">
    <template #header>
      <UDashboardToolbar>
        <template #left>
          <div class="flex items-center gap-2">
            <UButton variant="ghost" icon="i-lucide-chevron-left" size="sm" @click="prevWeek" />
            <UPopover v-model:open="showWeekPicker">
              <button class="week-picker-btn">
                <UIcon name="i-lucide-calendar" class="size-3.5 text-muted" />
                Week {{ selectedWeek.split('-W')[1] }} · {{ selectedWeek.split('-W')[0] }}
              </button>
              <template #content>
                <div class="p-3">
                  <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Selecteer datum</p>
                  <input
                    type="date"
                    :value="weekPickerDate"
                    @change="weekPickerDate = ($event.target as HTMLInputElement).value"
                    class="text-sm px-2 py-1.5 border border-default rounded-sm bg-default text-default outline-none cursor-pointer"
                  />
                  <p class="text-xs text-muted mt-1.5">Kiest de week van de geselecteerde datum</p>
                </div>
              </template>
            </UPopover>
            <UButton variant="ghost" icon="i-lucide-chevron-right" size="sm" @click="nextWeek" />
          </div>

          <UBadge v-if="isPublished" color="success" variant="soft">Gepubliceerd</UBadge>
          <UBadge v-else color="neutral" variant="soft">Concept</UBadge>
        </template>

        <template #right>
          <UButton variant="outline" icon="i-lucide-sparkles" @click="openAutoPlan">
            Auto-plannen
          </UButton>
          <UButton variant="ghost" icon="i-lucide-plus" @click="onShiftAdd('', 0)">
            Dienst toevoegen
          </UButton>
          <USeparator orientation="vertical" class="h-5" />
          <UButton
            v-if="!isPublished"
            color="primary"
            icon="i-lucide-send"
            @click="togglePublish"
          >
            Publiceren
          </UButton>
          <UButton
            v-else
            color="error"
            variant="ghost"
            icon="i-lucide-eye-off"
            @click="togglePublish"
          >
            Depubliceren
          </UButton>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div style="background: var(--c-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden">
        <ScheduleWeekGrid
          :shifts="shifts"
          :guards="guards"
          :week-days="DAY_LABELS"
          :week-dates="weekDates"
          :is-read-only="false"
          :dragging-employee-id="draggingEmployeeId"
          @shift:click="onShiftClick"
          @shift:delete="handleDeleted"
          @shift:add="onShiftAdd"
          @guard:dropped="onGuardDropped"
        />
      </div>
    </template>
  </UDashboardPanel>

  <LazyShiftModal
    :is-open="showModal"
    :shift="editingShift"
    :guards="guards"
    :week-dates="weekDates"
    :week-days="DAY_LABELS"
    :locked-guard-id="editingShift ? null : pendingGuardId"
    :default-date="editingShift ? null : (weekDates[pendingDay] ?? null)"
    @close="showModal = false; editingShift = null; pendingGuardId = null"
    @saved="handleSaved"
    @deleted="handleDeleted"
  />

  <LazyAutoPlanPreview
    :is-open="showAutoPlan"
    :is-loading="autoPlanLoading"
    :suggestions="autoPlanSuggestions"
    :unfillable="autoPlanUnfillable"
    :guards="guards"
    :week-days="DAY_LABELS"
    :week-dates="weekDates"
    @close="showAutoPlan = false"
    @confirm="handleAutoPlanConfirm"
  />
</template>

<style>
#schedule-guards {
  max-width: 370px;
}

.week-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
  min-width: 160px;
  justify-content: center;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  cursor: pointer;
}
</style>
