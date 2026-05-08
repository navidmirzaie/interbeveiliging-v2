<script lang="ts" setup>
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

async function handleLogin() {
  error.value = null
  isLoading.value = true
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (authError) {
      error.value = 'Onjuist e-mailadres of wachtwoord'
      return
    }
    await navigateTo('/dashboard')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center" style="background: var(--c-bg)">
    <div class="w-full max-w-md" style="background: var(--c-surface); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-lg)">
      <div class="flex items-center gap-3 mb-8">
        <div style="background: var(--c-navy); border-radius: var(--radius-md); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <UIcon name="i-lucide-shield" style="color: white; font-size: 20px" />
        </div>
        <div>
          <h1 style="font-size: 16px; font-weight: 600; color: var(--c-text)">InterBeveiliging</h1>
          <p style="font-size: 12px; color: var(--c-muted)">Inloggen bij uw account</p>
        </div>
      </div>

      <div v-if="error" class="alert alert-error mb-4">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <UFormField label="E-mailadres" required>
          <UInput v-model="email" type="email" placeholder="u@uw-org.nl" autocomplete="email" size="xl" class="w-full"/>
        </UFormField>

        <UFormField label="Wachtwoord" required>
          <UInput v-model="password" type="password" placeholder="Uw wachtwoord" autocomplete="current-password" size="xl" class="w-full"/>
        </UFormField>

        <UButton type="submit" :loading="isLoading" block style="background: var(--c-blue)">
          Inloggen
        </UButton>
      </form>

      <p style="font-size: 12px; color: var(--c-muted); text-align: center; margin-top: 16px">
        Nog geen account?
        <NuxtLink to="/auth/register" style="color: var(--c-blue)">Registreren</NuxtLink>
      </p>
    </div>
  </div>
</template>
