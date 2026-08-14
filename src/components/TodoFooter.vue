<script setup>
defineProps({
  remainingCount: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <footer class="card-footer">
    <span>{{ remainingCount ? `还有 ${remainingCount} 项待完成` : '全部完成，干得漂亮！' }}</span>
    <span class="edit-hint">双击任务可快速编辑</span>
  </footer>
</template>
