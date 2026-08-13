<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'vue3-todo-list-items'
const THEME_STORAGE_KEY = 'vue3-todo-list-theme-mode'
const THEME_OPTIONS = [
  { value: 'system', label: '系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(savedTodos)
      ? savedTodos.filter((todo) => typeof todo?.title === 'string')
      : []
  } catch {
    return []
  }
}

function loadThemeMode() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_OPTIONS.some((option) => option.value === savedTheme) ? savedTheme : 'system'
  } catch {
    return 'system'
  }
}

const todos = ref(loadTodos())
const newTodo = ref('')
const activeFilter = ref('all')
const editingId = ref(null)
const editingTitle = ref('')
const editInput = ref(null)
const themeMode = ref(loadThemeMode())
const systemPrefersDark = ref(
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
)
let themeMediaQuery

watch(
  todos,
  (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)),
  { deep: true },
)

watch(themeMode, (mode) => localStorage.setItem(THEME_STORAGE_KEY, mode))

const remainingCount = computed(() => todos.value.filter((todo) => !todo.completed).length)
const completedCount = computed(() => todos.value.length - remainingCount.value)
const resolvedTheme = computed(() => {
  if (themeMode.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
  return themeMode.value
})
const visibleTodos = computed(() => {
  if (activeFilter.value === 'active') return todos.value.filter((todo) => !todo.completed)
  if (activeFilter.value === 'completed') return todos.value.filter((todo) => todo.completed)
  return todos.value
})

watch(
  resolvedTheme,
  (theme) => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#151725' : '#6366f1',
    )
    document.querySelector('link[rel="icon"]')?.setAttribute(
      'href',
      theme === 'dark' ? '/favicon-dark.svg' : '/favicon.svg',
    )
  },
  { immediate: true },
)

function updateSystemTheme(event) {
  systemPrefersDark.value = event.matches
}

onMounted(() => {
  themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = themeMediaQuery.matches
  themeMediaQuery.addEventListener('change', updateSystemTheme)
})

onBeforeUnmount(() => themeMediaQuery?.removeEventListener('change', updateSystemTheme))

function createId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function addTodo() {
  const title = newTodo.value.trim()
  if (!title) return

  todos.value.push({
    id: createId(),
    title,
    completed: false,
    createdAt: Date.now(),
  })
  newTodo.value = ''
}

function removeTodo(id) {
  todos.value = todos.value.filter((todo) => todo.id !== id)
}

function clearCompleted() {
  todos.value = todos.value.filter((todo) => !todo.completed)
}

function setThemeMode(mode) {
  themeMode.value = mode
}

function startEditing(todo) {
  editingId.value = todo.id
  editingTitle.value = todo.title
  nextTick(() => {
    const input = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value
    input?.focus()
  })
}

function saveEdit(todo) {
  if (editingId.value !== todo.id) return

  const title = editingTitle.value.trim()
  if (!title) {
    removeTodo(todo.id)
  } else {
    todo.title = title
  }
  cancelEdit()
}

function cancelEdit() {
  editingId.value = null
  editingTitle.value = ''
}
</script>

<template>
  <main class="page-shell">
    <section class="todo-card" aria-labelledby="page-title">
      <header class="card-header">
        <div class="brand-heading">
          <div class="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M5 12.5 9.25 17 19 7" />
            </svg>
          </div>
          <div>
            <p class="eyebrow">FOCUS LIST</p>
            <h1 id="page-title">今天要做什么？</h1>
            <p class="subtitle">把想法写下来，逐个完成。</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="theme-switcher" role="group" aria-label="外观设置">
            <div class="theme-options">
              <button
                v-for="option in THEME_OPTIONS"
                :key="option.value"
                class="theme-option"
                :class="{ active: themeMode === option.value }"
                type="button"
                :aria-label="`切换为${option.label}模式`"
                :aria-pressed="themeMode === option.value"
                @click="setThemeMode(option.value)"
              >
                <svg v-if="option.value === 'system'" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H4zM9 20h6m-3-4v4" /></svg>
                <svg v-else-if="option.value === 'light'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" /></svg>
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>

          <div class="progress" :aria-label="`已完成 ${completedCount} 项，共 ${todos.length} 项`">
            <span class="progress-number">{{ completedCount }}/{{ todos.length }}</span>
            <span class="progress-label">已完成</span>
          </div>
        </div>
      </header>

      <form class="add-form" @submit.prevent="addTodo">
        <label class="sr-only" for="new-todo">新增待办事项</label>
        <input
          id="new-todo"
          v-model="newTodo"
          class="new-todo-input"
          type="text"
          maxlength="120"
          autocomplete="off"
          placeholder="例如：整理本周会议记录"
        />
        <button class="add-button" type="submit" :disabled="!newTodo.trim()">
          <span aria-hidden="true">+</span>
          添加
        </button>
      </form>

      <div class="toolbar">
        <div class="filters" role="tablist" aria-label="待办筛选">
          <button
            v-for="filter in [
              { value: 'all', label: '全部' },
              { value: 'active', label: '未完成' },
              { value: 'completed', label: '已完成' },
            ]"
            :key="filter.value"
            class="filter-button"
            :class="{ active: activeFilter === filter.value }"
            type="button"
            role="tab"
            :aria-selected="activeFilter === filter.value"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <button
          v-if="completedCount"
          class="clear-button"
          type="button"
          @click="clearCompleted"
        >
          清除已完成
        </button>
      </div>

      <ul v-if="visibleTodos.length" class="todo-list" aria-live="polite">
        <li
          v-for="todo in visibleTodos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.completed, editing: editingId === todo.id }"
        >
          <label class="check-control" :aria-label="todo.completed ? `标记 ${todo.title} 为未完成` : `标记 ${todo.title} 为已完成`">
            <input v-model="todo.completed" type="checkbox" />
            <span class="checkmark" aria-hidden="true">✓</span>
          </label>

          <input
            v-if="editingId === todo.id"
            ref="editInput"
            v-model="editingTitle"
            class="edit-input"
            type="text"
            maxlength="120"
            @blur="saveEdit(todo)"
            @keyup.enter="saveEdit(todo)"
            @keyup.esc="cancelEdit"
          />
          <button
            v-else
            class="todo-title"
            type="button"
            :title="`编辑：${todo.title}`"
            @dblclick="startEditing(todo)"
          >
            {{ todo.title }}
          </button>

          <div v-if="editingId !== todo.id" class="item-actions">
            <button class="icon-button" type="button" :aria-label="`编辑 ${todo.title}`" @click="startEditing(todo)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5 4 4M4 20l3.4-.7L18.8 7.9a2.8 2.8 0 0 0-4-4L3.4 15.3 4 20Z" /></svg>
            </button>
            <button class="icon-button delete" type="button" :aria-label="`删除 ${todo.title}`" @click="removeTodo(todo.id)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 .8 13h8.4L17 7M10 11v5m4-5v5" /></svg>
            </button>
          </div>
        </li>
      </ul>

      <div v-else class="empty-state">
        <div class="empty-icon" aria-hidden="true">✓</div>
        <p>{{ todos.length ? '这个筛选条件下没有任务' : '还没有待办事项' }}</p>
        <span>{{ todos.length ? '换个筛选条件看看吧。' : '从上方输入框添加第一项任务吧。' }}</span>
      </div>

      <footer class="card-footer">
        <span>{{ remainingCount ? `还有 ${remainingCount} 项待完成` : '全部完成，干得漂亮！' }}</span>
        <span class="edit-hint">双击任务可快速编辑</span>
      </footer>
    </section>
  </main>
</template>
