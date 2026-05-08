export default defineNuxtRouteMiddleware(async (to) => {
  const client = useSupabaseClient()
  const { data: { session } } = await client.auth.getSession()

  if (!session && !to.path.startsWith('/auth')) {
    return navigateTo('/auth/login')
  }

  if (!session || to.path === '/auth/change-password') return

  const authStore = useAuthStore()
  if (!authStore.user) {
    await authStore.fetchSession()
  }
  if (authStore.user?.mustChangePassword) {
    return navigateTo('/auth/change-password')
  }
})
