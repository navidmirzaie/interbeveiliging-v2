<script lang="ts" setup>
import type { Guard } from '../../../base/types/database'

type Props = {
  guards: Guard[]
  periodHours?: Record<string, number>
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'drag:start': [employeeId: string]
  'drag:end': []
}>()

const search = ref('')

function guardColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff
  return `hsl(${hash % 360}, 55%, 52%)`
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return props.guards
  return props.guards.filter(g =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(q),
  )
})

function onDragStart(e: DragEvent, employeeId: string) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('employeeId', employeeId)
  }
  emits('drag:start', employeeId)
}

function onDragEnd() {
  emits('drag:end')
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="px-3 py-2.5 border-b border-default shrink-0">
      <UInput
        v-model="search"
        placeholder="Medewerker zoeken..."
        icon="i-lucide-search"
        size="lg"
        class="w-full"
      />
    </div>
    <div style="flex: 1; overflow-y: auto; padding: 0 8px 12px">
      <div
        v-for="guard in filtered"
        :key="guard.id"
        draggable="true"
        :data-employee-id="guard.id"
        @dragstart="onDragStart($event, guard.id)"
        @dragend="onDragEnd"
        style="padding: 8px 10px; border-radius: var(--radius-sm); cursor: grab; border: 1px solid var(--c-border); margin-bottom: 6px; background: var(--c-bg); transition: background 0.18s ease, box-shadow 0.18s ease"
        class="guard-card"
      >
        <div class="flex items-center gap-2">
          <span :style="`width: 10px; height: 10px; border-radius: 50%; background: ${guardColor(guard.id)}; flex-shrink: 0`" />
          <span style="font-size: 13px; font-weight: 600; color: var(--c-text)">{{ guard.firstName }} {{ guard.lastName }}</span>
        </div>
        <div class="flex flex-wrap gap-1 mt-1">
          <GrantBadge
            v-for="grant in (guard.grants ?? []).filter(g => {
              const today = new Date().toISOString().slice(0, 10)
              return (!g.startsAt || g.startsAt <= today) && (!g.expiresAt || g.expiresAt >= today)
            })"
            :key="grant.id"
            :name="grant.roleTypeName"
          />
        </div>
        <div v-if="guard.contractHoursPerPeriod" style="margin-top: 6px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px">
            <span style="font-size: 10px; color: var(--c-muted)">Periode uren</span>
            <span :style="`font-size: 10px; font-weight: 600; color: ${(periodHours?.[guard.id] ?? 0) > (guard.contractHoursPerPeriod ?? 0) ? '#ef4444' : 'var(--c-muted)'}`">
              {{ Math.round((periodHours?.[guard.id] ?? 0) * 10) / 10 }} / {{ guard.contractHoursPerPeriod }}u
            </span>
          </div>
          <div style="height: 4px; border-radius: 99px; background: var(--c-border); overflow: hidden">
            <div
              :style="`height: 100%; border-radius: 99px; width: ${Math.min(100, ((periodHours?.[guard.id] ?? 0) / (guard.contractHoursPerPeriod ?? 1)) * 100)}%; background: ${(periodHours?.[guard.id] ?? 0) > (guard.contractHoursPerPeriod ?? 0) ? '#ef4444' : '#22c55e'}; transition: width 0.3s ease`"
            />
          </div>
        </div>
      </div>
      <p v-if="!filtered.length" style="font-size: 12px; color: var(--c-muted); text-align: center; padding: 16px 0">
        Geen medewerkers
      </p>
    </div>
  </div>
</template>

<style>
.guard-card:hover {
  background: var(--c-surface) !important;
  box-shadow: var(--shadow-sm);
}

.guard-card:active {
  cursor: grabbing;
  opacity: 0.8;
}
</style>
