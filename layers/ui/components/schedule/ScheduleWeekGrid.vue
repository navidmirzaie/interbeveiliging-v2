<script lang="ts" setup>
import type { Shift, Guard } from '../../../base/types/database'

type Props = {
  shifts: (Shift & { firstName?: string; lastName?: string })[]
  guards: Guard[]
  weekDays: string[]
  weekDates: string[]
  isReadOnly: boolean
  draggingEmployeeId?: string | null
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'shift:click': [shiftId: string]
  'shift:delete': [shiftId: string]
  'shift:add': [guardId: string, day: number]
  'guard:dropped': [employeeId: string, guardId: string, day: number]
}>()

function shiftsForGuardDay(guardId: string, day: number): (Shift & { firstName?: string; lastName?: string })[] {
  const date = props.weekDates[day]
  return props.shifts.filter(s => s.profileId === guardId && s.date === date)
}

function isValidDropTarget(guardId: string): boolean {
  if (!props.draggingEmployeeId) return true
  return props.draggingEmployeeId === guardId
}

const hoveredGuardId = ref<string | null>(null)
const hoveredDay = ref<number | null>(null)

function onDragOver(e: DragEvent, guardId: string, day: number) {
  e.preventDefault()
  hoveredGuardId.value = guardId
  hoveredDay.value = day
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = isValidDropTarget(guardId) ? 'move' : 'none'
  }
}

function onDragLeave() {
  hoveredGuardId.value = null
  hoveredDay.value = null
}

function onDrop(e: DragEvent, guardId: string, day: number) {
  e.preventDefault()
  hoveredGuardId.value = null
  hoveredDay.value = null
  const employeeId = e.dataTransfer?.getData('employeeId')
  if (employeeId) emits('guard:dropped', employeeId, guardId, day)
}

function cellBg(guardId: string, day: number): string {
  if (!props.draggingEmployeeId) return ''
  if (hoveredGuardId.value === guardId && hoveredDay.value === day) {
    return isValidDropTarget(guardId)
      ? 'background: rgba(37,99,235,0.10)'
      : 'background: rgba(220,38,38,0.12)'
  }
  return ''
}
</script>

<template>
  <div style="overflow-x: auto">
    <table class="swimlane-grid">
      <thead>
        <tr>
          <th style="width: 160px; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted)">
            Medewerker
          </th>
          <th
            v-for="(day, i) in weekDays"
            :key="day"
            style="text-align: center; padding: 8px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted)"
          >
            {{ day }}<br>
            <span style="font-weight: 400; font-size: 11px; text-transform: none; letter-spacing: 0">
              {{ weekDates[i] ? weekDates[i]!.slice(8, 10) + '-' + weekDates[i]!.slice(5, 7) + '-' + weekDates[i]!.slice(0, 4) : '' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="guard in guards" :key="guard.id" style="border-top: 1px solid var(--c-border)">
          <td style="width: 160px; padding: 8px 12px; vertical-align: top">
            <div style="font-size: 13px; font-weight: 600; color: var(--c-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
              {{ guard.firstName }} {{ guard.lastName }}
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
          </td>
          <td
            v-for="(_, day) in weekDays"
            :key="day"
            class="swimlane-cell"
            @dragover="onDragOver($event, guard.id, day)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, guard.id, day)"
          >
            <div
              class="swimlane-cell-inner"
              :class="{ 'swimlane-cell-clickable': !isReadOnly }"
              :style="cellBg(guard.id, day)"
              @click="!isReadOnly && emits('shift:add', guard.id, day)"
            >
              <ScheduleWeekGridGuardCard
                v-for="shift in shiftsForGuardDay(guard.id, day)"
                :key="shift.id"
                :shift="shift"
                :is-read-only="isReadOnly"
                @shift:click="emits('shift:click', $event)"
                @shift:delete="emits('shift:delete', $event)"
              />
              <div
                v-if="!isReadOnly && !shiftsForGuardDay(guard.id, day).length"
                class="add-shift-hint"
              >+</div>
            </div>
          </td>
        </tr>
        <tr v-if="!guards.length">
          <td :colspan="weekDays.length + 1" style="padding: 32px; text-align: center; color: var(--c-muted); font-size: 13px">
            Geen medewerkers beschikbaar
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.swimlane-cell {
  padding: 6px;
  vertical-align: top;
  min-width: 130px;
}

.swimlane-cell-inner {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background 0.18s ease;
}

.swimlane-cell-clickable {
  cursor: pointer;
}

.swimlane-cell:hover .swimlane-cell-inner {
  background: var(--c-bg);
}

.add-shift-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 20px;
  line-height: 1;
  color: var(--c-muted);
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: none;
  user-select: none;
  min-height: 48px;
}

.swimlane-cell-inner:hover .add-shift-hint {
  opacity: 0.4;
}

.shift-block {
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: opacity 0.18s ease;
  width: 100%;
  box-sizing: border-box;
}

.shift-block:hover {
  opacity: 0.85;
}

.shift-block.published {
  background: var(--c-blue-bg);
  border: 1px solid var(--c-blue);
  color: var(--c-blue-tx);
}

.shift-block.draft {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  color: var(--c-muted);
}

.shift-block.ghost {
  background: rgba(245, 158, 11, 0.12);
  border: 1.5px dashed #F59E0B;
  color: #92400E;
}

.shift-time {
  font-weight: 600;
  font-size: 11px;
}

.shift-location {
  font-size: 10px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
