<script lang="ts" setup>
type Props = {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showName: false,
})

const authStore = useAuthStore()

const sizeMap = { sm: 24, md: 32, lg: 48 } as const
const px = computed(() => sizeMap[props.size])

const initials = computed(() => {
  const name = authStore.organisation?.name ?? ''
  return name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div class="flex items-center gap-2">
    <img
      v-if="authStore.organisation?.logoUrl"
      :src="authStore.organisation.logoUrl"
      :alt="authStore.organisation?.name"
      :style="`height: ${px}px; width: auto; object-fit: contain`"
    />
    <div
      v-else
      :style="`
        width: ${px}px;
        height: ${px}px;
        border-radius: var(--radius-sm);
        background: var(--c-blue);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: ${Math.round(px * 0.38)}px;
        font-weight: 700;
        flex-shrink: 0
      `"
    >
      {{ initials }}
    </div>
    <span
      v-if="showName && authStore.organisation?.name"
      style="font-size: 14px; font-weight: 700; color: #fff"
    >
      {{ authStore.organisation.name }}
    </span>
  </div>
</template>
