<script setup>
import { useTheme } from './composables/useTheme'
import { useTodos } from './composables/useTodos'
import TodoHeader from './components/TodoHeader.vue'
import TodoInput from './components/TodoInput.vue'
import TodoToolbar from './components/TodoToolbar.vue'
import TodoList from './components/TodoList.vue'
import TodoFooter from './components/TodoFooter.vue'

const { themeMode, THEME_OPTIONS, setThemeMode } = useTheme()
const {
  activeFilter,
  FILTER_OPTIONS,
  visibleTodos,
  remainingCount,
  completedCount,
  totalCount,
  storageWriteFailed,
  addTodo,
  removeTodo,
  updateTodoTitle,
  clearCompleted,
  setFilter,
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
        :completed-count="completedCount"
        @change-filter="setFilter"
        @clear-completed="clearCompleted"
      />

      <TodoList
        :todos="visibleTodos"
        :total-count="totalCount"
        @update-title="handleUpdateTitle"
        @remove="removeTodo"
      />

      <p v-if="storageWriteFailed" class="storage-warning" role="status">
        当前无法保存更改，请检查浏览器存储空间或隐私设置。
      </p>

      <TodoFooter :remaining-count="remainingCount" />
    </section>
  </main>
</template>
