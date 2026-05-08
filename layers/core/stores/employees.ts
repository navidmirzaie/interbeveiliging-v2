import { defineStore } from 'pinia'
import type { Employee } from '../../base/types/database'
import type { DayAvailability } from '../../base/types/api'

export const useEmployeesStore = defineStore('employees', () => {
  const all = ref<Employee[]>([])
  const isLoading = ref(false)

  const schedulable = computed(() =>
    all.value.filter(e => e.role === 'employee' && !e.deletedAt),
  )

  async function fetchEmployees() {
    isLoading.value = true
    try {
      const data = await $fetch<{ employees: Employee[] }>('/api/employees')
      all.value = data.employees ?? []
    } finally {
      isLoading.value = false
    }
  }

  async function updateAvailability(profileId: string, availability: DayAvailability[]) {
    await $fetch(`/api/employees/${profileId}/availability`, {
      method: 'PUT',
      body: { availability },
    })
  }

  return { all, schedulable, isLoading, fetchEmployees, updateAvailability }
})
