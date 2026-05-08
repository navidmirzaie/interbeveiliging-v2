<script lang="ts" setup>
import type { ShiftSuggestion, UnfillableSlot } from '../../../base/types/api'
import type { Guard } from '../../../base/types/database'

type Props = {
  isOpen: boolean
  isLoading: boolean
  suggestions: ShiftSuggestion[]
  unfillable: UnfillableSlot[]
  guards: Guard[]
  weekDays: string[]
  weekDates: string[]
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'close': []
  'confirm': [accepted: ShiftSuggestion[]]
}>()

const accepted = ref<Set<string>>(new Set())
const showUnfillable = ref(false)

watch(() => props.suggestions, (list) => {
  accepted.value = new Set(list.map((_, i) => String(i)))
}, { immediate: true })

function toggleSuggestion(index: number) {
  const key = String(index)
  if (accepted.value.has(key)) {
    accepted.value.delete(key)
  } else {
    accepted.value.add(key)
  }
  accepted.value = new Set(accepted.value)
}

function acceptAll() {
  accepted.value = new Set(props.suggestions.map((_, i) => String(i)))
}

function rejectAll() {
  accepted.value = new Set()
}

function confirm() {
  const list = props.suggestions.filter((_, i) => accepted.value.has(String(i)))
  emits('confirm', list)
}

function guardName(id: string): string {
  const g = props.guards.find(g => g.id === id)
  return g ? `${g.firstName} ${g.lastName}` : id
}

function dayLabel(date: string): string {
  const i = props.weekDates.indexOf(date)
  return i >= 0 ? `${props.weekDays[i]} ${date.slice(8)}` : date
}
</script>

<template>
  <UModal :open="isOpen" @update:open="(v) => !v && emits('close')" title="Auto-plan voorstel" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="isLoading" style="text-align: center; padding: 48px; color: var(--c-muted)">
        <UIcon name="i-lucide-loader-circle" style="font-size: 32px; animation: spin 1s linear infinite" />
        <p style="margin-top: 12px; font-size: 13px">Claude plant het rooster in...</p>
      </div>

      <template v-else>
        <div class="flex items-center justify-between mb-3">
          <p style="font-size: 13px; color: var(--c-muted)">
            {{ accepted.size }} van {{ suggestions.length }} diensten geselecteerd
          </p>
          <div class="flex gap-2">
            <UButton size="xs" variant="ghost" @click="acceptAll">Alles accepteren</UButton>
            <UButton size="xs" variant="ghost" color="error" @click="rejectAll">Alles afwijzen</UButton>
          </div>
        </div>

        <div class="flex flex-col gap-2 mb-4" style="max-height: 400px; overflow-y: auto">
          <div
            v-for="(s, i) in suggestions"
            :key="i"
            class="flex items-center gap-3"
            style="padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid; cursor: pointer; transition: all 0.18s ease"
            :style="accepted.has(String(i))
              ? 'border-color: var(--c-blue); background: var(--c-blue-bg)'
              : 'border-color: var(--c-border); background: var(--c-bg); opacity: 0.6'"
            @click="toggleSuggestion(i)"
          >
            <UIcon
              :name="accepted.has(String(i)) ? 'i-lucide-check-circle' : 'i-lucide-circle'"
              :style="accepted.has(String(i)) ? 'color: var(--c-blue)' : 'color: var(--c-muted)'"
            />
            <div style="flex: 1">
              <span style="font-size: 13px; font-weight: 600; color: var(--c-text)">{{ guardName(s.employeeId) }}</span>
              <span style="font-size: 12px; color: var(--c-muted); margin-left: 8px">{{ dayLabel(s.date) }}</span>
            </div>
            <div class="shift-block ghost" style="cursor: pointer">
              <span class="shift-time">{{ s.startTime }}–{{ s.endTime }}</span>
              <span v-if="s.locationLabel" class="shift-location">{{ s.locationLabel }}</span>
            </div>
          </div>

          <p v-if="!suggestions.length" style="font-size: 13px; color: var(--c-muted); padding: 16px; text-align: center">
            Geen diensten voorgesteld
          </p>
        </div>

        <div v-if="unfillable.length" style="margin-bottom: 16px">
          <button
            class="cao-toggle"
            @click="showUnfillable = !showUnfillable"
          >
            <UIcon
              :name="showUnfillable ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              style="font-size: 14px"
            />
            <span>{{ unfillable.length }} niet-invulbare slot{{ unfillable.length === 1 ? '' : 's' }} (CAO beperkingen)</span>
          </button>
          <div v-if="showUnfillable" style="margin-top: 8px; border: 1px solid var(--c-amber-bg); border-radius: var(--radius-sm); overflow: hidden">
            <div
              v-for="u in unfillable"
              :key="u.date"
              style="padding: 8px 12px; font-size: 12px; border-bottom: 1px solid var(--c-amber-bg); background: #FFFBEB"
            >
              <strong style="color: var(--c-text)">{{ u.date.slice(8, 10) }}-{{ u.date.slice(5, 7) }}-{{ u.date.slice(0, 4) }}</strong>
              <span style="color: var(--c-amber-tx); margin-left: 8px">{{ u.reason }}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end">
          <UButton variant="ghost" @click="emits('close')">Annuleren</UButton>
          <UButton
            :disabled="accepted.size === 0"
            style="background: var(--c-blue)"
            @click="confirm"
          >
            {{ accepted.size }} diensten accepteren
          </UButton>
        </div>
      </template>
    </template>
  </UModal>
</template>

<style>
.cao-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-amber-tx);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}
.cao-toggle:hover {
  opacity: 0.8;
}
</style>
