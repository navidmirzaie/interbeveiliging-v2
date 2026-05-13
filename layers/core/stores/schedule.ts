import { defineStore } from 'pinia'
import type { Shift } from '../../base/types/database'
import type { CreateShiftPayload } from '../../base/types/api'

function getCurrentISOWeek(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export const useScheduleStore = defineStore('schedule', () => {
  const shifts = ref<Shift[]>([])
  const selectedWeek = ref(getCurrentISOWeek())
  const isLoading = ref(false)
  const isPublished = ref(false)

  async function fetchWeek(week: string) {
    isLoading.value = true
    try {
      const data = await $fetch<{ shifts: Shift[]; published: boolean }>(`/api/shifts?week=${week}`)
      shifts.value = data.shifts ?? []
      isPublished.value = data.published ?? false
    } finally {
      isLoading.value = false
    }
  }

  async function createShift(payload: CreateShiftPayload) {
    const result = await $fetch<{ shift: Shift }>('/api/shifts', { method: 'POST', body: payload })
    shifts.value.push(result.shift)
    return result.shift
  }

  async function updateShift(id: string, payload: Partial<Shift>) {
    const result = await $fetch<{ shift: Shift }>(`/api/shifts/${id}`, { method: 'PATCH', body: payload })
    const idx = shifts.value.findIndex(s => s.id === id)
    if (idx !== -1) shifts.value[idx] = result.shift
    return result.shift
  }

  async function deleteShift(id: string) {
    await $fetch(`/api/shifts/${id}` as string, { method: 'DELETE' as 'DELETE' })
    shifts.value = shifts.value.filter(s => s.id !== id)
  }

  async function setPublished(published: boolean) {
    await $fetch('/api/shifts/publish', { method: 'PATCH', body: { week: selectedWeek.value, published } })
    isPublished.value = published
    shifts.value = shifts.value.map(s => ({ ...s, weekPublished: published }))
  }

  async function publishWeek() {
    return setPublished(true)
  }

  async function unpublishWeek() {
    return setPublished(false)
  }

  return {
    shifts,
    selectedWeek,
    isLoading,
    isPublished,
    fetchWeek,
    createShift,
    updateShift,
    deleteShift,
    publishWeek,
    unpublishWeek,
  }
})
