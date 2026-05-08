<script lang="ts" setup>
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-guard'] })

const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id as string

const { data: employeeData, refresh: refreshEmployee } = await useFetch(`/api/employees/${id}`, {
  headers: useRequestHeaders(['cookie']),
})

const { data: roleTypesData } = await useFetch('/api/role-types', {
  headers: useRequestHeaders(['cookie']),
})

const employee = computed(() => employeeData.value?.employee ?? null)
const roleTypes = computed(() => roleTypesData.value ?? [])
const grants = computed(() => employee.value?.grants ?? [])

const showGrantForm = ref(false)
const grantForm = reactive({
  roleTypeId: '',
  startsAt: '',
  expiresAt: '',
})

async function handleAddGrant() {
  if (!grantForm.roleTypeId) return
  await $fetch('/api/grants', {
    method: 'POST',
    body: {
      profileId: id,
      roleTypeId: grantForm.roleTypeId,
      startsAt: grantForm.startsAt || null,
      expiresAt: grantForm.expiresAt || null,
    },
  })
  showGrantForm.value = false
  grantForm.roleTypeId = ''
  grantForm.startsAt = ''
  grantForm.expiresAt = ''
  await refreshEmployee()
}

async function handleDeleteGrant(grantId: string) {
  await $fetch(`/api/grants/${grantId}`, { method: 'DELETE' })
  await refreshEmployee()
}
</script>

<template>
  <div style="padding: var(--page-padding)">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/employees">
        <UButton variant="ghost" icon="i-lucide-arrow-left" size="sm" />
      </NuxtLink>
      <h1 v-if="employee" style="font-size: 16px; font-weight: 600; color: var(--c-text)">
        {{ employee.firstName }} {{ employee.lastName }}
      </h1>
    </div>

    <div v-if="!employee" style="text-align: center; padding: 48px; color: var(--c-muted); font-size: 13px">
      Medewerker niet gevonden
    </div>

    <template v-else>
      <!-- Employee details card -->
      <div style="background: var(--c-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: var(--card-padding); margin-bottom: 24px">
        <p style="font-size: 13px; font-weight: 600; color: var(--c-text); margin-bottom: 12px">Gegevens</p>
        <div class="grid grid-cols-2 gap-3" style="font-size: 13px; color: var(--c-text)">
          <div>
            <span style="color: var(--c-muted); font-size: 12px">E-mail</span>
            <p>{{ employee.email }}</p>
          </div>
          <div>
            <span style="color: var(--c-muted); font-size: 12px">Telefoon</span>
            <p>{{ employee.phone ?? '—' }}</p>
          </div>
          <div>
            <span style="color: var(--c-muted); font-size: 12px">Personeelsnummer</span>
            <p>{{ employee.employeeNumber ?? '—' }}</p>
          </div>
          <div>
            <span style="color: var(--c-muted); font-size: 12px">Contracturen / periode</span>
            <p>{{ employee.contractHoursPerPeriod ?? 144 }} uur</p>
          </div>
        </div>
      </div>

      <!-- Grants section -->
      <div style="background: var(--c-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: var(--card-padding)">
        <div class="flex items-center justify-between mb-4">
          <p style="font-size: 13px; font-weight: 600; color: var(--c-text)">Rollen / diploma's</p>
          <UButton
            v-if="authStore.canPlan"
            size="xs"
            @click="showGrantForm = true"
            style="background: var(--c-blue)"
          >
            <UIcon name="i-lucide-plus" class="mr-1" />
            Toevoegen
          </UButton>
        </div>

        <div v-if="!grants.length" style="font-size: 13px; color: var(--c-muted); padding: 16px 0">
          Geen rollen toegewezen
        </div>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="grant in grants"
            :key="grant.id"
            class="flex items-center justify-between"
            style="padding: 8px 0; border-bottom: 1px solid var(--c-border)"
          >
            <div class="flex items-center gap-3">
              <GrantBadge
                :name="grant.roleTypeName"
                :starts-at="grant.startsAt"
                :expires-at="grant.expiresAt"
              />
              <span style="font-size: 12px; color: var(--c-muted)">
                <template v-if="grant.startsAt">van {{ grant.startsAt }}</template>
                <template v-if="grant.expiresAt"> t/m {{ grant.expiresAt }}</template>
              </span>
            </div>
            <UButton
              v-if="authStore.canPlan"
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click="handleDeleteGrant(grant.id)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Add grant modal -->
    <UModal :open="showGrantForm" @close="showGrantForm = false" title="Rol toevoegen">
      <template #body>
        <form @submit.prevent="handleAddGrant" class="flex flex-col gap-4">
          <UFormField label="Roltype" required>
            <USelectMenu
              v-model="grantForm.roleTypeId"
              :items="roleTypes.map(rt => ({ label: rt.name, value: rt.id }))"
              placeholder="Selecteer een rol"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ingangsdatum">
              <UInput v-model="grantForm.startsAt" type="date" />
            </UFormField>
            <UFormField label="Vervaldatum">
              <UInput v-model="grantForm.expiresAt" type="date" />
            </UFormField>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <UButton variant="ghost" @click="showGrantForm = false">Annuleren</UButton>
            <UButton type="submit" style="background: var(--c-blue)">Toevoegen</UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
