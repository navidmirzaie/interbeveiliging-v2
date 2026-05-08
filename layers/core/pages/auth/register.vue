<script lang="ts" setup>
import { useRouter } from 'nuxt/app';
import {ref, reactive} from 'vue';

definePageMeta({ layout: false });

const router = useRouter();

type Form = {
  organisationName: string
  kvkNumber: string
  email: string
  password: string
}

const form = reactive<Form>({
  organisationName: '',
  kvkNumber: '',
  email: '',
  password: '',
})

const error = ref<string | null>(null)
const isLoading = ref(false)

function validateKvk(value: string): boolean {
  return /^\d{8}$/.test(value)
}

async function handleSubmit() {
  error.value = null

  if (!validateKvk(form.kvkNumber)) {
    error.value = 'KvK-nummer moet exact 8 cijfers bevatten'
    return
  }

  isLoading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: form,
    })
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const fetchError = err as { data?: { error?: string } }
    error.value = fetchError.data?.error ?? 'Registratie mislukt. Probeer opnieuw.'
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
          <p style="font-size: 12px; color: var(--c-muted)">Organisatie aanmaken</p>
        </div>
      </div>

      <div v-if="error" class="alert alert-error mb-4">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <UFormField label="Organisatienaam" required>
          <UInput v-model="form.organisationName" placeholder="InterBeveiliging B.V." class="w-full" size="xl"/>
        </UFormField>

        <UFormField label="KvK-nummer" required hint="Exact 8 cijfers" size="xl">
          <UInput v-model="form.kvkNumber" placeholder="12345678" maxlength="8" class="w-full" />
        </UFormField>

        <UFormField label="E-mailadres" required size="xl">
          <UInput v-model="form.email" type="email" placeholder="admin@uw-org.nl" class="w-full"/>
        </UFormField>

        <UFormField label="Wachtwoord" required size="xl">
          <UInput v-model="form.password" type="password" placeholder="Min. 8 tekens" class="w-full"/>
        </UFormField>

        <UButton type="submit" :loading="isLoading" block style="background: var(--c-blue)">
          Registreren
        </UButton>
      </form>

      <p style="font-size: 12px; color: var(--c-muted); text-align: center; margin-top: 16px">
        Al een account?
        <NuxtLink to="/auth/login" style="color: var(--c-blue)">Inloggen</NuxtLink>
      </p>
    </div>
  </div>
</template>
