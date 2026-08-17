<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'

const props = defineProps({
  todos: {
    type: Array,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
  storedCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update-title', 'toggle', 'remove'])

const emptyTitle = computed(() => {
  if (props.totalCount) return '这个筛选条件下没有任务'
  if (props.storedCount) return '这一天还没有任务'
  return '还没有待办事项'
})

const emptyHint = computed(() => {
  if (props.totalCount) return '换个筛选条件看看吧。'
  if (props.storedCount) return '可以切换上面的日期查看其他天。'
  return '从上方输入框添加第一项任务吧。'
})
</script>

<template>
  <ul v-if="todos.length" class="todo-list" aria-live="polite">
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :todo="todo"
      @update-title="emit('update-title', $event)"
      @toggle="emit('toggle', $event)"
      @remove="emit('remove', $event)"
    />
  </ul>

  <div v-else class="empty-state">
    <div class="empty-icon" aria-hidden="true">✓</div>
    <p>{{ emptyTitle }}</p>
    <span>{{ emptyHint }}</span>
  </div>
</template>
