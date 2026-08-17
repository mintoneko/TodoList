<script setup>
import { useTheme } from './composables/useTheme'
import { useTodos } from './composables/useTodos'
import TodoHeader from './components/TodoHeader.vue'
import TodoInput from './components/TodoInput.vue'
import TodoToolbar from './components/TodoToolbar.vue'
import TodoList from './components/TodoList.vue'
import TodoFooter from './components/TodoFooter.vue'
import SyncSettings from './components/SyncSettings.vue'

const { themeMode, THEME_OPTIONS, setThemeMode } = useTheme()
const {
  activeFilter,
  selectedDate,
  dayOptions,
  FILTER_OPTIONS,
  visibleTodos,
  remainingCount,
  completedCount,
  totalCount,
  storedCount,
  storageWriteFailed,
  syncWriteFailed,
  addTodo,
  removeTodo,
  updateTodoTitle,
  toggleTodo,
  clearCompleted,
  setFilter,
  setSelectedDate,
} = useTodos()

function handleUpdateTitle({ id, title }) {
  updateTodoTitle(id, title)
}
</script>

<template>
  <main class="page-shell">
    <section class="todo-card" aria-labelledby="page-title">
      <TodoHeader
        :theme-mode="themeMode"
        :theme-options="THEME_OPTIONS"
        :completed-count="completedCount"
        :total-count="totalCount"
        @set-theme="setThemeMode"
      />

      <TodoInput @add="addTodo" />

      <TodoToolbar
        :active-filter="activeFilter"
        :filter-options="FILTER_OPTIONS"
        :selected-date="selectedDate"
        :day-options="dayOptions"
        :completed-count="completedCount"
        @change-filter="setFilter"
        @change-date="setSelectedDate"
        @clear-completed="clearCompleted"
      />

      <TodoList
        :todos="visibleTodos"
        :total-count="totalCount"
        :stored-count="storedCount"
        @update-title="handleUpdateTitle"
        @toggle="toggleTodo"
        @remove="removeTodo"
      />

      <p v-if="storageWriteFailed" class="storage-warning" role="status">
        当前无法保存更改，请检查浏览器存储空间或隐私设置。
      </p>
      <p v-else-if="syncWriteFailed" class="storage-warning" role="status">
        已保存在本机，但尚未同步到 LiteDB。请检查服务连接后重试。
      </p>

      <TodoFooter :remaining-count="remainingCount" :sync-write-failed="syncWriteFailed" />
    </section>
    <SyncSettings />
  </main>
</template>
