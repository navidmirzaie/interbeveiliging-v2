import { defineStore } from 'pinia'
import type { AuthUser, Organisation } from '../../base/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const organisation = ref<Organisation | null>(null)

  const role = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'admin')
  const isPlanner = computed(() => role.value === 'planner')
  const isEmployee = computed(() => role.value === 'employee')
  const canPlan = computed(() => isAdmin.value || isPlanner.value)

  async function fetchSession() {
    try {
      const data = await $fetch<{ user: AuthUser; organisation: Organisation }>('/api/auth/session')
      user.value = data.user ?? null
      organisation.value = data.organisation ?? null
    } catch {
      user.value = null
      organisation.value = null
    }
  }

  function clear() {
    user.value = null
    organisation.value = null
  }

  return {
    user,
    organisation,
    role,
    isAdmin,
    isPlanner,
    isEmployee,
    canPlan,
    fetchSession,
    clear,
  }
})
