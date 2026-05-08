<script lang="ts" setup>
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-guard'], ssr: false })

const authStore = useAuthStore()
const toast = useToast()
const { applyPreview, applyTheme } = useTenantTheme()

const { data, refresh } = await useFetch('/api/settings', {
  headers: useRequestHeaders(['cookie']),
})

const form = reactive({
  name: '',
  primaryColour: '#1E3A5F',
  dashboardTitle: '',
  emailSendTime: '08:00',
  emailSendDay: 1,
})

const logoUrl = ref<string | null>(null)
const isPreviewActive = ref(false)
const isSaving = ref(false)
const isUploadingLogo = ref(false)
const logoFileInput = ref<HTMLInputElement | null>(null)

watch(data, (d) => {
  if (!d) return
  form.name = d.org?.name ?? ''
  form.primaryColour = d.org?.primaryColour ?? '#1E3A5F'
  form.dashboardTitle = d.org?.dashboardTitle ?? ''
  form.emailSendTime = d.settings?.emailSendTime?.slice(0, 5) ?? '08:00'
  form.emailSendDay = d.settings?.emailSendDay ?? 1
  logoUrl.value = d.org?.logoUrl ?? null
}, { immediate: true })

watch(() => form.primaryColour, () => {
  if (!isPreviewActive.value) isPreviewActive.value = true
  applyPreview({ primary: form.primaryColour })
})

function resetPreview() {
  isPreviewActive.value = false
  applyTheme()
}

// ─── Logo upload ────────────────────────────────────────────────────────────

function triggerLogoUpload() {
  logoFileInput.value?.click()
}

async function handleLogoFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isUploadingLogo.value = true
  try {
    const fd = new FormData()
    fd.append('file', file, file.name)

    const result = await $fetch<{ url: string }>('/api/settings/logo', {
      method: 'POST',
      body: fd,
    })

    logoUrl.value = result.url
    await authStore.fetchSession()
    toast.add({ title: 'Logo opgeslagen', color: 'success' })
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Upload mislukt'
    toast.add({ title: 'Logo uploaden mislukt', description: msg, color: 'error' })
  } finally {
    isUploadingLogo.value = false
    if (logoFileInput.value) logoFileInput.value.value = ''
  }
}

// ─── Save ───────────────────────────────────────────────────────────────────

async function handleSave() {
  isSaving.value = true
  try {
    await $fetch('/api/settings', {
      method: 'PATCH',
      body: {
        name: form.name,
        primaryColour: form.primaryColour,
        dashboardTitle: form.dashboardTitle,
        emailSendTime: form.emailSendTime,
        emailSendDay: form.emailSendDay,
      },
    })
    await refresh()
    await authStore.fetchSession()
    isPreviewActive.value = false
    toast.add({ title: 'Instellingen opgeslagen', color: 'success' })
  } catch {
    toast.add({ title: 'Opslaan mislukt', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const DAY_OPTIONS = [
  { label: 'Maandag', value: 1 },
  { label: 'Dinsdag', value: 2 },
  { label: 'Woensdag', value: 3 },
  { label: 'Donderdag', value: 4 },
  { label: 'Vrijdag', value: 5 },
  { label: 'Zaterdag', value: 6 },
  { label: 'Zondag', value: 7 },
]
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Instellingen">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <!-- Live preview banner -->
      <Transition name="slide-down">
        <div
          v-if="isPreviewActive"
          class="flex items-center justify-between gap-4 px-4 py-2 bg-primary-50 border-b border-primary-200 text-sm"
        >
          <div class="flex items-center gap-2 text-primary-700">
            <UIcon name="i-lucide-eye" class="size-4 shrink-0" />
            <span class="font-medium">Voorvertoning actief</span>
            <span class="text-primary-500">— sla op om de kleuren te bewaren</span>
          </div>
          <UButton size="xs" variant="ghost" color="neutral" @click="resetPreview">
            Annuleren
          </UButton>
        </div>
      </Transition>
    </template>

    <template #body>
      <form class="max-w-2xl flex flex-col gap-6" @submit.prevent="handleSave">

        <!-- Organisatie -->
        <UCard>
          <template #header>
            <p class="text-sm font-semibold">Organisatie</p>
          </template>
          <div class="flex flex-col gap-4">
            <UFormField label="Naam organisatie" required>
              <UInput v-model="form.name" placeholder="InterBeveiliging B.V." />
            </UFormField>
            <UFormField label="Dashboard titel">
              <UInput v-model="form.dashboardTitle" placeholder="Bijv. Bewakingsrooster" />
            </UFormField>
          </div>
        </UCard>

        <!-- Huisstijl -->
        <UCard>
          <template #header>
            <p class="text-sm font-semibold">Huisstijl</p>
          </template>

          <div class="flex flex-col gap-6">
            <!-- Logo -->
            <div>
              <p class="text-xs font-medium text-muted mb-3">Logo</p>
              <div class="flex items-center gap-4">
                <div class="size-16 rounded-lg border border-default bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    v-if="logoUrl"
                    :src="logoUrl"
                    alt="Organisatie logo"
                    class="size-full object-contain p-1"
                  />
                  <UIcon v-else name="i-lucide-image" class="size-6 text-muted" />
                </div>
                <div class="flex flex-col gap-2">
                  <UButton
                    variant="outline"
                    icon="i-lucide-upload"
                    size="sm"
                    :loading="isUploadingLogo"
                    @click="triggerLogoUpload"
                  >
                    {{ logoUrl ? 'Logo vervangen' : 'Logo uploaden' }}
                  </UButton>
                  <p class="text-xs text-muted">PNG, JPG, WebP of SVG · max. 2 MB</p>
                </div>
              </div>
              <input
                ref="logoFileInput"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                class="hidden"
                @change="handleLogoFileChange"
              />
            </div>

            <USeparator />

            <!-- Colours -->
            <div class="max-w-xs">
              <UFormField label="Primaire kleur">
                <div class="flex items-center gap-2.5">
                  <input
                    v-model="form.primaryColour"
                    type="color"
                    class="size-9 rounded border border-default cursor-pointer shrink-0"
                  />
                  <UInput v-model="form.primaryColour" placeholder="#1E3A5F" class="font-mono" />
                </div>
                <template #hint>
                  <span class="text-xs text-muted">Knoppen &amp; actieve links</span>
                </template>
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Roostermail -->
        <UCard>
          <template #header>
            <p class="text-sm font-semibold">Roostermail</p>
          </template>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Verzendag">
              <USelectMenu
                v-model="form.emailSendDay"
                :items="DAY_OPTIONS"
                value-key="value"
                label-key="label"
              />
            </UFormField>
            <UFormField label="Verzendtijd">
              <UInput v-model="form.emailSendTime" type="time" />
            </UFormField>
          </div>
          <p class="text-xs text-muted mt-3">
            Medewerkers ontvangen hun rooster voor de volgende week op dit tijdstip.
          </p>
        </UCard>

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="isSaving">
            Opslaan
          </UButton>
        </div>
      </form>
    </template>
  </UDashboardPanel>
</template>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
