<script setup>
import { computed } from 'vue'
import { useLiteDB } from '../composables/useLiteDB'

const props = defineProps({
  syncWriteFailed: {
    type: Boolean,
    default: false,
  },
})

const { connectionLabel, connectionTone, openSettings } = useLiteDB()

const statusText = computed(() => {
  if (props.syncWriteFailed && connectionTone.value === 'online') return '待重试'
  if (connectionTone.value === 'online') return '已同步'
  if (connectionTone.value === 'pending') return '连接中'
  if (connectionTone.value === 'error') return '同步失败'
  return '仅本地'
})
</script>

<template>
  <button
    class="sync-status"
    :class="connectionTone"
    type="button"
    :aria-label="`数据同步：${connectionLabel}，点击打开设置`"
    :title="connectionLabel"
    @click="openSettings"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 18.5h9.2a4.2 4.2 0 0 0 .6-8.4 6 6 0 0 0-11.4-1.6A4.1 4.1 0 0 0 7.5 18.5Z" />
    </svg>
    <span>{{ statusText }}</span>
  </button>
</template>
