<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  activeFilter: {
    type: String,
    required: true,
  },
  filterOptions: {
    type: Array,
    required: true,
  },
  selectedDate: {
    type: Number,
    required: true,
  },
  dayOptions: {
    type: Array,
    required: true,
  },
  completedCount: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['change-filter', 'change-date', 'clear-completed'])

const isOpen = ref(false)
const wrapRef = ref(null)

const selectedDay = computed(
  () => props.dayOptions.find((day) => day.value === props.selectedDate) || props.dayOptions[0],
)

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function chooseDay(value) {
  emit('change-date', value)
  isOpen.value = false
}

function handlePointerDown(event) {
  if (!isOpen.value) return
  if (wrapRef.value && !wrapRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') isOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('keydown', handleKeydown)
})
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
    <div class="toolbar-actions">
      <button
        v-if="completedCount"
        class="clear-button"
        type="button"
        @click="emit('clear-completed')"
      >
        清除已完成
      </button>
      <div ref="wrapRef" class="day-picker">
        <button
          class="day-trigger"
          type="button"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
          aria-label="按日期查看"
          @click="toggleOpen"
        >
          <span class="day-trigger-text">
            <strong>{{ selectedDay.label }}</strong>
            <em>{{ selectedDay.dateLabel }}</em>
          </span>
          <svg class="day-caret" :class="{ open: isOpen }" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <ul
          v-if="isOpen"
          class="day-menu"
          role="listbox"
          :aria-label="`选择日期，当前 ${selectedDay.label} ${selectedDay.dateLabel}`"
        >
          <li v-for="day in dayOptions" :key="day.value">
            <button
              class="day-option"
              :class="{ active: selectedDate === day.value }"
              type="button"
              role="option"
              :aria-selected="selectedDate === day.value"
              @click="chooseDay(day.value)"
            >
              <span>
                <strong>{{ day.label }}</strong>
                <em>{{ day.dateLabel }}</em>
              </span>
              <svg v-if="selectedDate === day.value" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5 9.25 17 19 7" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
