<script lang="ts" setup>
type Props = {
  name: string
  startsAt?: string | null
  expiresAt?: string | null
}

const props = defineProps<Props>()

const today = new Date().toISOString().slice(0, 10)

const status = computed((): 'active' | 'pending' | 'expired' => {
  if (props.expiresAt && props.expiresAt < today) return 'expired'
  if (props.startsAt && props.startsAt > today) return 'pending'
  return 'active'
})
</script>

<template>
  <span
    class="role-badge"
    :style="status === 'expired'
      ? 'background: var(--c-muted); color: #fff; opacity: 0.6'
      : status === 'pending'
        ? 'background: var(--c-amber-bg); color: var(--c-amber-tx)'
        : ''"
  >
    {{ name }}
    <span v-if="status === 'expired'" style="font-size: 10px; margin-left: 2px">(verlopen)</span>
    <span v-else-if="status === 'pending'" style="font-size: 10px; margin-left: 2px">(gepland)</span>
  </span>
</template>
