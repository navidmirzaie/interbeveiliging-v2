<script lang="ts" setup>
import type { Employee } from '../../../base/types/database'

type Props = {
  employee?: Employee | null
  isOpen: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'close': []
  'saved': [employee: Partial<Employee>]
}>()

const isEditing = computed(() => !!props.employee?.id)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  employeeNumber: '',
  role: 'employee' as 'admin' | 'planner' | 'employee',
  contractHoursPerPeriod: 144,
  password: '',
  passwordConfirm: '',
})

const roleOptions = [
  { label: 'Medewerker', value: 'employee' },
  { label: 'Planner', value: 'planner' },
  { label: 'Beheerder', value: 'admin' },
]

const passwordError = ref('')
const showPassword = ref(false)

function resetForm(emp: typeof props.employee) {
  if (emp) {
    form.firstName = emp.firstName
    form.lastName = emp.lastName
    form.email = emp.email
    form.phone = emp.phone ?? ''
    form.employeeNumber = emp.employeeNumber ?? ''
    form.role = (emp.role as 'admin' | 'planner' | 'employee') ?? 'employee'
    form.contractHoursPerPeriod = emp.contractHoursPerPeriod ?? 144
  } else {
    form.firstName = ''
    form.lastName = ''
    form.email = ''
    form.phone = ''
    form.employeeNumber = ''
    form.role = 'employee'
    form.contractHoursPerPeriod = 144
    form.password = ''
    form.passwordConfirm = ''
  }
  passwordError.value = ''
  showPassword.value = false
}

watch(() => props.employee, resetForm, { immediate: true })

// Reset every time the modal opens (handles reopening with same null employee)
watch(() => props.isOpen, (open) => {
  if (open) resetForm(props.employee)
})

function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%^&*()_+-='
  const all = upper + lower + digits + special
  const arr = new Uint8Array(12)
  crypto.getRandomValues(arr)
  const chars = [
    upper[arr[0]! % upper.length]!,
    lower[arr[1]! % lower.length]!,
    digits[arr[2]! % digits.length]!,
    special[arr[3]! % special.length]!,
    ...Array.from({ length: 8 }, (_, i) => all[arr[i + 4]! % all.length]!),
  ]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = arr[i]! % (i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  const pwd = chars.join('')
  form.password = pwd
  form.passwordConfirm = pwd
  passwordError.value = ''
}

function handleSubmit() {
  const hasPassword = form.password.length > 0
  if (!isEditing.value || hasPassword) {
    if (form.password.length < 8) {
      passwordError.value = 'Wachtwoord moet minimaal 8 tekens bevatten'
      return
    }
    if (form.password !== form.passwordConfirm) {
      passwordError.value = 'Wachtwoorden komen niet overeen'
      return
    }
  }
  passwordError.value = ''
  const { passwordConfirm: _, ...payload } = form
  emits('saved', payload)
}
</script>

<template>
  <UModal :open="isOpen" @update:open="(v) => !v && emits('close')" :title="isEditing ? 'Medewerker bewerken' : 'Medewerker toevoegen'">
    <template #body>
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Voornaam" required>
            <UInput v-model="form.firstName" placeholder="Jan" />
          </UFormField>
          <UFormField label="Achternaam" required>
            <UInput v-model="form.lastName" placeholder="de Vries" />
          </UFormField>
        </div>

        <UFormField label="E-mailadres (gebruikersnaam)" required>
          <UInput v-model="form.email" type="email" placeholder="jan@org.nl" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Telefoonnummer">
            <UInput v-model="form.phone" placeholder="+31 6 12345678" />
          </UFormField>
          <UFormField label="Personeelsnummer">
            <UInput v-model="form.employeeNumber" placeholder="EMP-001" />
          </UFormField>
        </div>

        <UFormField label="Rol">
          <USelect v-model="form.role" :items="roleOptions" value-key="value" label-key="label" />
        </UFormField>

        <UFormField label="Contracturen per periode">
          <UInput v-model.number="form.contractHoursPerPeriod" type="number" min="1" max="240" />
        </UFormField>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px">
            <span style="font-size: 13px; font-weight: 500; color: var(--c-text)">
              {{ isEditing ? 'Wachtwoord opnieuw instellen' : 'Wachtwoord instellen' }}
              <span v-if="!isEditing" style="color: #ef4444; margin-left: 2px">*</span>
            </span>
            <UButton variant="ghost" size="xs" icon="i-lucide-refresh-cw" @click.prevent="generatePassword">
              Genereer wachtwoord
            </UButton>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="isEditing ? 'Nieuw wachtwoord' : 'Wachtwoord'">
              <UInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="isEditing ? 'Laat leeg om niet te wijzigen' : 'Minimaal 8 tekens'"
                autocomplete="new-password"
                :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'"
                    :aria-pressed="showPassword"
                    @click.prevent="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>
            <UFormField label="Wachtwoord bevestigen">
              <UInput
                v-model="form.passwordConfirm"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="isEditing ? 'Laat leeg om niet te wijzigen' : 'Herhaal wachtwoord'"
                autocomplete="new-password"
                :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'"
                    :aria-pressed="showPassword"
                    @click.prevent="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>
          </div>
          <p v-if="passwordError" style="font-size: 12px; color: #ef4444; margin-top: 4px">{{ passwordError }}</p>
          <p v-else style="font-size: 12px; color: var(--c-muted); margin-top: 4px">
            <template v-if="isEditing">Laat leeg om het wachtwoord ongewijzigd te laten.</template>
            <template v-else>De medewerker ontvangt een welkomstmail met zijn inloggegevens en wordt gevraagd het wachtwoord direct te wijzigen.</template>
          </p>
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <UButton variant="ghost" @click="emits('close')">Annuleren</UButton>
          <UButton type="submit" style="background: var(--c-blue)">
            {{ isEditing ? 'Opslaan' : 'Toevoegen' }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
