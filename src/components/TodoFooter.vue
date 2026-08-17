<script setup>
import SyncStatus from './SyncStatus.vue'

defineProps({
  remainingCount: {
    type: Number,
    required: true,
  },
  syncWriteFailed: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <footer class="card-footer">
    <span>{{ remainingCount ? `还有 ${remainingCount} 项待完成` : '全部完成，干得漂亮！' }}</span>
    <div class="footer-meta">
      <SyncStatus :sync-write-failed="syncWriteFailed" />
      <span class="edit-hint">双击可编辑</span>
    </div>
  </footer>
</template>
