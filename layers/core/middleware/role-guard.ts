import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (authStore.role === 'employee') {
    if (to.path.startsWith('/settings')) return navigateTo('/dashboard')
    if (to.path === '/schedule') return navigateTo('/schedule/my')
    if (to.path.startsWith('/employees')) return navigateTo('/dashboard')
  }

  if (authStore.canPlan && to.path.startsWith('/availability')) {
    return navigateTo('/dashboard')
  }
})
