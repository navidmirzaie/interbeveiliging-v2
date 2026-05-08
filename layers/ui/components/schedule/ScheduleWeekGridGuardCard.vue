<script lang="ts" setup>
import type { Shift } from '../../../base/types/database'

type Props = {
  shift: Shift & { firstName?: string; lastName?: string }
  isReadOnly: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'shift:click': [shiftId: string]
  'shift:delete': [shiftId: string]
}>()

function guardColor(profileId: string): { bg: string; border: string; text: string } {
  let hash = 0
  for (let i = 0; i < profileId.length; i++) {
    hash = (hash * 31 + profileId.charCodeAt(i)) & 0xffff
  }
  const hue = hash % 360
  return {
    bg: `hsl(${hue}, 55%, 90%)`,
    border: `hsl(${hue}, 45%, 62%)`,
    text: `hsl(${hue}, 50%, 28%)`,
  }
}

const color = computed(() => guardColor(props.shift.profileId))

const ctxMenu = ref({ visible: false, x: 0, y: 0 })

function onClick() {
  if (!props.isReadOnly) emits('shift:click', props.shift.id)
}

function onContextMenu(e: MouseEvent) {
  if (props.isReadOnly) return
  e.preventDefault()
  e.stopPropagation()
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY }
}

function closeCtxMenu() {
  ctxMenu.value.visible = false
}

function onCtxEdit() {
  closeCtxMenu()
  emits('shift:click', props.shift.id)
}

function onCtxDelete() {
  closeCtxMenu()
  emits('shift:delete', props.shift.id)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeCtxMenu()
}

onMounted(() => {
  document.addEventListener('click', closeCtxMenu)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeCtxMenu)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="shift-block"
    :class="shift.weekPublished ? 'published' : 'draft'"
    :style="`background: ${color.bg}; border-color: ${color.border}; color: ${color.text}`"
    @click.stop="onClick"
    @contextmenu.prevent="onContextMenu"
    :title="`${shift.startTime}–${shift.endTime}${shift.locationLabel ? ' · ' + shift.locationLabel : ''}`"
  >
    <span class="shift-time">{{ shift.startTime.slice(0, 5) }}–{{ shift.endTime.slice(0, 5) }}</span>
    <span v-if="shift.locationLabel" class="shift-location">{{ shift.locationLabel }}</span>
  </div>

  <Teleport to="body">
    <div
      v-if="ctxMenu.visible"
      class="shift-ctx-menu"
      :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
      @click.stop
    >
      <button class="shift-ctx-item" @click="onCtxEdit">
        <UIcon name="i-lucide-edit" style="font-size: 13px" />
        Bewerken
      </button>
      <div class="shift-ctx-divider" />
      <button class="shift-ctx-item shift-ctx-item--danger" @click="onCtxDelete">
        <UIcon name="i-lucide-trash-2" style="font-size: 13px" />
        Verwijderen
      </button>
    </div>
  </Teleport>
</template>

<style>
.shift-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 150px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.shift-ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.14s ease;
}

.shift-ctx-item:hover {
  background: var(--c-bg);
}

.shift-ctx-item--danger {
  color: var(--c-red-tx, #dc2626);
}

.shift-ctx-item--danger:hover {
  background: var(--c-red-bg, rgba(220,38,38,0.08));
}

.shift-ctx-divider {
  height: 1px;
  background: var(--c-border);
  margin: 2px 0;
}
</style>
