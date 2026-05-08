<script lang="ts" setup>
import type { Employee } from '../../base/types/database'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-guard'] })

const employeesStore = useEmployeesStore()
const authStore = useAuthStore()
const toast = useToast()

const showForm = ref(false)
const editingEmployee = ref<Employee | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)

const { data, refresh } = await useFetch('/api/employees', {
  headers: useRequestHeaders(['cookie']),
})

const employees = computed(() => data.value?.employees ?? [])

async function handleSaved(form: Record<string, unknown>) {
  if (editingEmployee.value) {
    await $fetch(`/api/employees/${editingEmployee.value.id}`, { method: 'PATCH', body: form })
    toast.add({ title: 'Medewerker bijgewerkt', color: 'success' })
  } else {
    const result = await $fetch<{ emailError?: string | null }>('/api/employees', { method: 'POST', body: form })
    if (result.emailError) {
      toast.add({
        title: 'Account aangemaakt, welkomstmail mislukt',
        description: result.emailError,
        color: 'warning',
        duration: 8000,
      })
    } else {
      toast.add({ title: 'Medewerker toegevoegd', description: 'Welkomstmail is verstuurd.', color: 'success' })
    }
  }
  showForm.value = false
  editingEmployee.value = null
  await refresh()
}

function openEdit(id: string) {
  editingEmployee.value = employees.value.find(e => e.id === id) ?? null
  showForm.value = true
}

function confirmDelete(id: string) {
  deletingId.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingId.value) return
  await $fetch(`/api/employees/${deletingId.value}`, { method: 'DELETE' })
  showDeleteConfirm.value = false
  deletingId.value = null
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="employees">
    <template #header>
      <UDashboardNavbar title="Medewerkers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="authStore.canPlan"
            icon="i-lucide-plus"
            @click="showForm = true; editingEmployee = null"
          >
            Medewerker toevoegen
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <EmployeeTable
        :employees="employees"
        :can-edit="authStore.canPlan"
        @edit="openEdit"
        @delete="confirmDelete"
      />
    </template>
  </UDashboardPanel>

  <EmployeeForm
    :is-open="showForm"
    :employee="editingEmployee"
    @close="showForm = false"
    @saved="handleSaved"
  />

  <UModal :open="showDeleteConfirm" @close="showDeleteConfirm = false" title="Medewerker verwijderen">
    <template #body>
      <p class="text-sm">
        Weet u zeker dat u deze medewerker wilt verwijderen? De medewerker wordt gedeactiveerd en verdwijnt uit alle lijsten, maar diensten blijven bewaard.
      </p>
      <div class="flex gap-3 justify-end mt-4">
        <UButton variant="ghost" @click="showDeleteConfirm = false">Annuleren</UButton>
        <UButton color="error" @click="handleDelete">Verwijderen</UButton>
      </div>
    </template>
  </UModal>
</template>
