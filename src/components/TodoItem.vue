<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update-title', 'remove'])

const isEditing = ref(false)
const editingTitle = ref('')
const editInput = ref(null)

function startEditing() {
  isEditing.value = true
  editingTitle.value = props.todo.title
  nextTick(() => {
    editInput.value?.focus()
  })
}

function saveEdit() {
  if (!isEditing.value) return
  const title = editingTitle.value.trim()
  if (!title) {
    emit('remove', props.todo.id)
  } else {
    emit('update-title', { id: props.todo.id, title })
  }
  cancelEdit()
}

function cancelEdit() {
  isEditing.value = false
  editingTitle.value = ''
}
</script>

<template>
  <li
    class="todo-item"
    :class="{ completed: todo.completed, editing: isEditing }"
  >
    <label
      class="check-control"
      :aria-label="todo.completed ? `标记 ${todo.title} 为未完成` : `标记 ${todo.title} 为已完成`"
    >
      <input v-model="todo.completed" type="checkbox" />
      <span class="checkmark" aria-hidden="true">✓</span>
    </label>

    <input
      v-if="isEditing"
      ref="editInput"
      v-model="editingTitle"
      class="edit-input"
      type="text"
      maxlength="120"
      @blur="saveEdit"
      @keyup.enter="saveEdit"
      @keyup.esc="cancelEdit"
    />
    <button
      v-else
      class="todo-title"
      type="button"
      :title="`编辑：${todo.title}`"
      @dblclick="startEditing"
    >
      {{ todo.title }}
    </button>

    <div v-if="!isEditing" class="item-actions">
      <button
        class="icon-button"
        type="button"
        :aria-label="`编辑 ${todo.title}`"
        @click="startEditing"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14.5 5.5 4 4M4 20l3.4-.7L18.8 7.9a2.8 2.8 0 0 0-4-4L3.4 15.3 4 20Z" />
        </svg>
      </button>
      <button
        class="icon-button delete"
        type="button"
        :aria-label="`删除 ${todo.title}`"
        @click="emit('remove', todo.id)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M9 7V4h6v3m-8 0 .8 13h8.4L17 7M10 11v5m4-5v5" />
        </svg>
      </button>
    </div>
  </li>
</template>
