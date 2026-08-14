<script setup>
defineProps({
  themeMode: {
    type: String,
    required: true,
  },
  themeOptions: {
    type: Array,
    required: true,
  },
  completedCount: {
    type: Number,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['set-theme'])
</script>

<template>
  <header class="card-header">
    <div class="brand-heading">
      <div class="brand-logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M5 12.5 9.25 17 19 7" />
        </svg>
      </div>
      <div>
        <p class="eyebrow">TODO LIST</p>
        <h1 id="page-title">今天要做什么？</h1>
        <p class="subtitle">把想法写下来，逐个完成。</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="theme-switcher" role="group" aria-label="外观设置">
        <div class="theme-options">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            class="theme-option"
            :class="{ active: themeMode === option.value }"
            type="button"
            :aria-label="`切换为${option.label}模式`"
            :aria-pressed="themeMode === option.value"
            @click="emit('set-theme', option.value)"
          >
            <svg v-if="option.value === 'system'" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5.5h16v10H4zM9 20h6m-3-4v4" />
            </svg>
            <svg v-else-if="option.value === 'light'" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />
            </svg>
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <div class="progress" :aria-label="`已完成 ${completedCount} 项，共 ${totalCount} 项`">
        <span class="progress-number">{{ completedCount }}/{{ totalCount }}</span>
        <span class="progress-label">已完成</span>
      </div>
    </div>
  </header>
</template>
