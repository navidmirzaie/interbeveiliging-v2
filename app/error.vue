<script lang="ts" setup>
const props = defineProps<{ error: { statusCode: number; message: string } }>()

function goHome() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div
    style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--c-bg)"
  >
    <div style="text-align: center; max-width: 400px; padding: 32px">
      <div
        style="width: 64px; height: 64px; border-radius: 50%; background: var(--c-red-bg); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px"
      >
        <UIcon name="i-lucide-alert-triangle" style="font-size: 28px; color: var(--c-red-tx)" />
      </div>

      <h1 style="font-size: 20px; font-weight: 700; color: var(--c-text); margin-bottom: 8px">
        Fout {{ error.statusCode }}
      </h1>
      <p style="font-size: 14px; color: var(--c-muted); margin-bottom: 24px">
        {{ error.message || 'Er is iets misgegaan.' }}
      </p>

      <UButton @click="goHome" style="background: var(--c-blue)">
        Terug naar dashboard
      </UButton>
    </div>
  </div>
</template>
