<script lang="ts" setup>
import type { Shift, Guard } from '../../../base/types/database'

type Props = {
  isOpen: boolean
  shift?: Shift | null
  guards: Guard[]
  weekDates: string[]
  weekDays: string[]
  lockedGuardId?: string | null
  defaultDate?: string | null
}

type ShiftForm = {
  profileId: string
  date: string
  startTime: string
  endTime: string
  locationLabel: string
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'close': []
  'saved': [form: ShiftForm]
  'deleted': [id: string]
}>()

const isEditing = computed(() => !!props.shift?.id)

const form = reactive<ShiftForm>({
  profileId: '',
  date: '',
  startTime: '',
  endTime: '',
  locationLabel: '',
})

const showDeleteConfirm = ref(false)

watch(() => props.shift, (s) => {
  if (s) {
    form.profileId = s.profileId
    form.date = s.date
    form.startTime = s.startTime.slice(0, 5)
    form.endTime = s.endTime.slice(0, 5)
    form.locationLabel = s.locationLabel ?? ''
  } else {
    form.profileId = props.lockedGuardId ?? ''
    form.date = props.defaultDate ?? props.weekDates[0] ?? ''
    form.startTime = '07:00'
    form.endTime = '15:00'
    form.locationLabel = ''
  }
}, { immediate: true })

watch(() => props.lockedGuardId, (id) => {
  if (id && !props.shift) form.profileId = id
})

watch(() => props.defaultDate, (date) => {
  if (!props.shift && date) form.date = date
})

const durationMinutes = computed(() => {
  const [sh = 0, sm = 0] = form.startTime.split(':').map(Number)
  const [eh = 0, em = 0] = form.endTime.split(':').map(Number)
  if (isNaN(sh) || isNaN(eh)) return 0
  return ((eh * 60 + em) - (sh * 60 + sm) + 1440) % 1440
})

const caoWarning = computed((): string | null => {
  const mins = durationMinutes.value
  const [sh = 0] = form.startTime.split(':').map(Number)
  const hours = (mins / 60).toFixed(1)
  const isNight = sh >= 22 || sh < 6
  if (isNight && mins > 480) {
    return `Let op: nachtdienst duurt ${hours}u — overschrijdt maximale nachtdienst van 8 uur (CAO art. 4.3)`
  }
  if (mins > 540) {
    return `Let op: dienst duurt ${hours}u — overschrijdt maximale dagdienst van 9 uur (CAO art. 4.2)`
  }
  return null
})

const availabilityWarning = computed((): string | null => {
  if (!form.profileId || !form.date) return null
  const guard = props.guards.find(g => g.id === form.profileId)
  if (!guard?.availability?.length) return null
  const dayOfWeek = new Date(form.date + 'T00:00:00').getDay()
  const avail = guard.availability.find(a => a.dayOfWeek === dayOfWeek)
  if (!avail) return `${guard.firstName} heeft geen beschikbaarheid opgegeven voor deze dag`
  if (avail.maxHours === 0) return `${guard.firstName} is niet beschikbaar op deze dag`
  const shiftHours = durationMinutes.value / 60
  if (shiftHours > avail.maxHours) {
    return `${guard.firstName} is maximaal ${avail.maxHours}u beschikbaar op deze dag — dienst duurt ${shiftHours.toFixed(1)}u`
  }
  return null
})

const dateItems = computed(() =>
  props.weekDates.map((date, i) => ({ label: `${props.weekDays[i]} ${date}`, value: date })),
)

const guardItems = computed(() =>
  props.guards.map(g => ({ label: `${g.firstName} ${g.lastName}`, value: g.id })),
)

function handleSubmit() {
  emits('saved', { ...form })
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

function handleDelete() {
  if (props.shift?.id) emits('deleted', props.shift.id)
  showDeleteConfirm.value = false
}
</script>

<template>
  <UModal
    :open="isOpen"
    @update:open="(v) => !v && emits('close')"
    :title="isEditing ? 'Dienst bewerken' : 'Dienst toevoegen'"
  >
    <template #body>
      <div v-if="availabilityWarning" class="alert alert-warning mb-4">
        <UIcon name="i-lucide-user-x" style="flex-shrink: 0; margin-top: 1px" />
        <span>{{ availabilityWarning }}</span>
      </div>
      <div v-if="caoWarning" class="alert alert-warning mb-4">
        <UIcon name="i-lucide-alert-triangle" style="flex-shrink: 0; margin-top: 1px" />
        <span>{{ caoWarning }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <UFormField v-if="!lockedGuardId" label="Medewerker" required>
          <USelectMenu
            v-model="form.profileId"
            :items="guardItems"
            value-key="value"
            placeholder="Selecteer medewerker"
          />
        </UFormField>
        <div v-else style="font-size: 13px; color: var(--c-muted); margin-bottom: 4px">
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted)">Medewerker</span><br>
          <span style="font-size: 13px; font-weight: 600; color: var(--c-text)">
            {{ guards.find(g => g.id === lockedGuardId)?.firstName }} {{ guards.find(g => g.id === lockedGuardId)?.lastName }}
          </span>
        </div>

        <UFormField label="Dag" required>
          <USelectMenu
            v-model="form.date"
            :items="dateItems"
            value-key="value"
            placeholder="Selecteer dag"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Begintijd" required>
            <UInput v-model="form.startTime" type="time" />
          </UFormField>
          <UFormField label="Eindtijd" required>
            <UInput v-model="form.endTime" type="time" />
          </UFormField>
        </div>

        <UFormField label="Locatie">
          <UInput v-model="form.locationLabel" placeholder="Bijv. Hoofdkantoor" />
        </UFormField>

        <div class="flex items-center justify-between pt-2">
          <UButton
            v-if="isEditing"
            variant="ghost"
            color="error"
            @click.prevent="confirmDelete"
          >
            Verwijderen
          </UButton>
          <div v-else />

          <div class="flex gap-3">
            <UButton variant="ghost" @click.prevent="emits('close')">Annuleren</UButton>
            <UButton type="submit" style="background: var(--c-blue)">
              {{ isEditing ? 'Opslaan' : 'Toevoegen' }}
            </UButton>
          </div>
        </div>
      </form>
    </template>
  </UModal>

  <UModal :open="showDeleteConfirm" @update:open="(v) => !v && (showDeleteConfirm = false)" title="Dienst verwijderen">
    <template #body>
      <p style="font-size: 13px; color: var(--c-text)">
        Weet u zeker dat u deze dienst wilt verwijderen?
      </p>
      <div class="flex gap-3 justify-end mt-4">
        <UButton variant="ghost" @click="showDeleteConfirm = false">Annuleren</UButton>
        <UButton color="error" @click="handleDelete">Verwijderen</UButton>
      </div>
    </template>
  </UModal>
</template>
