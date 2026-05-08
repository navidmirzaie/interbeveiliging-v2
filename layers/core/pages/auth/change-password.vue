<script lang="ts" setup>
definePageMeta({ layout: false, middleware: ['auth'] })

const form = reactive({
  password: '',
  passwordConfirm: '',
})

const error = ref('')
const loading = ref(false)
const toast = useToast()

async function handleSubmit() {
  error.value = ''
  if (form.password.length < 8) {
    error.value = 'Wachtwoord moet minimaal 8 tekens bevatten'
    return
  }
  if (form.password !== form.passwordConfirm) {
    error.value = 'Wachtwoorden komen niet overeen'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'PATCH',
      body: { password: form.password },
    })
    const authStore = useAuthStore()
    await authStore.fetchSession()
    toast.add({ title: 'Wachtwoord gewijzigd', description: 'U kunt nu inloggen met uw nieuwe wachtwoord.', color: 'success' })
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Er is iets misgegaan'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F1F5F9; padding: 24px">
    <div style="width: 100%; max-width: 400px">
      <div style="background: #1E3A5F; border-radius: 10px 10px 0 0; padding: 28px 32px">
        <h1 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 4px">Wachtwoord wijzigen</h1>
        <p style="font-size: 13px; color: #93C5FD; margin: 0">Om veiligheidsredenen moet u uw wachtwoord instellen voordat u verder gaat.</p>
      </div>

      <div style="background: #FFFFFF; border-radius: 0 0 10px 10px; padding: 28px 32px; box-shadow: 0 4px 16px rgba(0,0,0,.08)">
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <UFormField label="Nieuw wachtwoord" required>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Minimaal 8 tekens"
              autocomplete="new-password"
              size="lg"
              style="width: 100%"
            />
          </UFormField>

          <UFormField label="Wachtwoord bevestigen" required>
            <UInput
              v-model="form.passwordConfirm"
              type="password"
              placeholder="Herhaal uw wachtwoord"
              autocomplete="new-password"
              size="lg"
              style="width: 100%"
            />
          </UFormField>

          <p v-if="error" style="font-size: 12px; color: #ef4444; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 8px 12px; margin: 0">
            {{ error }}
          </p>

          <UButton
            type="submit"
            color="primary"
            size="lg"
            :loading="loading"
            style="width: 100%; justify-content: center; margin-top: 4px"
          >
            Wachtwoord instellen
          </UButton>
        </form>
      </div>
    </div>
  </div>
</template>
