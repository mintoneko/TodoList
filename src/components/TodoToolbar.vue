<script setup>
defineProps({
  activeFilter: {
    type: String,
    required: true,
  },
  filterOptions: {
    type: Array,
    required: true,
  },
  completedCount: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['change-filter', 'clear-completed'])
</script>

<template>
  <div class="toolbar">
    <div class="filters" role="tablist" aria-label="待办筛选">
      <button
        v-for="filter in filterOptions"
        :key="filter.value"
        class="filter-button"
        :class="{ active: activeFilter === filter.value }"
        type="button"
        role="tab"
        :aria-selected="activeFilter === filter.value"
        @click="emit('change-filter', filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>
    <button
      v-if="completedCount"
      class="clear-button"
      type="button"
      @click="emit('clear-completed')"
    >
      清除已完成
    </button>
  </div>
</template>
