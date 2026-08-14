<script setup>
import TodoItem from './TodoItem.vue'

defineProps({
  todos: {
    type: Array,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update-title', 'remove'])
</script>

<template>
  <ul v-if="todos.length" class="todo-list" aria-live="polite">
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :todo="todo"
      @update-title="emit('update-title', $event)"
      @remove="emit('remove', $event)"
    />
  </ul>

  <div v-else class="empty-state">
    <div class="empty-icon" aria-hidden="true">✓</div>
    <p>{{ totalCount ? '这个筛选条件下没有任务' : '还没有待办事项' }}</p>
    <span>{{ totalCount ? '换个筛选条件看看吧。' : '从上方输入框添加第一项任务吧。' }}</span>
  </div>
</template>
