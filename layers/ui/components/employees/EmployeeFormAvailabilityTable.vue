<script lang="ts" setup>
const DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

type Props = { modelValue: number[]; contractHoursPerPeriod: number }
const props = defineProps<Props>()
const emits = defineEmits<{ 'update:modelValue': [value: number[]] }>()

const hours = ref([...props.modelValue])

watch(() => props.modelValue, (val) => {
  hours.value = [...val]
}, { deep: true })

const totalHours = computed(() => hours.value.reduce((a, b) => a + b, 0))
const isMaxReached = computed(() => totalHours.value >= props.contractHoursPerPeriod)

function isDisabled(i: number): boolean {
  return isMaxReached.value && hours.value[i] === 0
}

function updateDay(index: number, value: number) {
  hours.value[index] = value
  emits('update:modelValue', [...hours.value])
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <p style="font-size: 12px; font-weight: 600; color: var(--c-text)">Beschikbaarheid</p>
      <span style="font-size: 11px; color: var(--c-muted)">
        {{ totalHours }} / {{ contractHoursPerPeriod }} uur
      </span>
    </div>
    <div v-if="isMaxReached" style="font-size: 11px; color: var(--c-muted); margin-bottom: 8px; padding: 6px 8px; background: var(--c-bg); border-radius: var(--radius-sm); border: 1px solid var(--c-border)">
      Maximum uren bereikt. Verhoog "Contracturen per periode" om meer dagen in te vullen.
    </div>
    <div class="flex flex-col gap-2">
      <div v-for="(day, i) in DAYS" :key="day" class="flex items-center gap-3">
        <span style="width: 90px; font-size: 13px; color: var(--c-text)">{{ day }}</span>
        <UInput
          type="number"
          :model-value="hours[i]"
          :disabled="isDisabled(i)"
          min="0"
          max="24"
          step="0.5"
          style="width: 80px"
          @update:model-value="updateDay(i, Number($event))"
        />
        <span style="font-size: 12px; color: var(--c-muted)">uur</span>
      </div>
    </div>
  </div>
</template>
