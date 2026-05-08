<script lang="ts" setup>
import type { Employee } from '../../../base/types/database'

type Props = {
  employees: Employee[]
  canEdit: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'edit': [id: string]
  'delete': [id: string]
}>()

function isGrantActive(grant: { startsAt: string | null; expiresAt: string | null }): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const started = !grant.startsAt || grant.startsAt <= today
  const notExpired = !grant.expiresAt || grant.expiresAt >= today
  return started && notExpired
}

const columns = [
  { key: 'name', label: 'Naam' },
  { key: 'employeeNumber', label: 'Nummer' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefoon' },
  { key: 'role', label: 'Rol' },
  { key: 'grants', label: 'Kwalificaties' },
  { key: 'actions', label: '' },
]

const roleLabels: Record<string, string> = {
  admin: 'Beheerder',
  planner: 'Planner',
  employee: 'Medewerker',
}

const roleColors: Record<string, string> = {
  admin: 'background: var(--c-red-bg); color: var(--c-red-tx)',
  planner: 'background: var(--c-blue-bg); color: var(--c-blue-tx)',
  employee: 'background: var(--c-green-bg); color: var(--c-green-tx)',
}
</script>

<template>
  <div style="background: var(--c-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden">
    <table style="width: 100%; border-collapse: collapse">
      <thead>
        <tr style="border-bottom: 1px solid var(--c-border)">
          <th v-for="col in columns" :key="col.key"
            style="text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted)">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="employee in employees" :key="employee.id"
          style="border-bottom: 1px solid var(--c-border)">
          <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: var(--c-text)">
            <NuxtLink :to="`/employees/${employee.id}`" style="color: var(--c-blue); text-decoration: none">
              {{ employee.firstName }} {{ employee.lastName }}
            </NuxtLink>
          </td>
          <td style="padding: 12px 16px; font-size: 13px; color: var(--c-muted)">
            {{ employee.employeeNumber ?? '—' }}
          </td>
          <td style="padding: 12px 16px; font-size: 13px; color: var(--c-text)">
            {{ employee.email }}
          </td>
          <td style="padding: 12px 16px; font-size: 13px; color: var(--c-muted)">
            {{ employee.phone ?? '—' }}
          </td>
          <td style="padding: 12px 16px">
            <span
              style="display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.04em"
              :style="roleColors[employee.role] ?? roleColors.employee"
            >
              {{ roleLabels[employee.role] ?? employee.role }}
            </span>
          </td>
          <td style="padding: 12px 16px">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="grant in (employee.grants ?? []).filter(g => isGrantActive(g))"
                :key="grant.id"
                class="role-badge">
                {{ grant.roleTypeName }}
              </span>
              <span v-if="!(employee.grants ?? []).some(g => isGrantActive(g))"
                style="font-size: 11px; color: var(--c-muted)">—</span>
            </div>
          </td>
          <td style="padding: 12px 16px; text-align: right">
            <div v-if="canEdit" class="flex gap-2 justify-end">
              <UButton size="md" variant="ghost" icon="i-lucide-edit" @click="emits('edit', employee.id)" />
              <UButton size="md" variant="ghost" color="error" icon="i-lucide-trash-2" @click="emits('delete', employee.id)" />
            </div>
          </td>
        </tr>
        <tr v-if="!employees.length">
          <td :colspan="columns.length" style="padding: 32px; text-align: center; color: var(--c-muted); font-size: 13px">
            Geen medewerkers gevonden
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
