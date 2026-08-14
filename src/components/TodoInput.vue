<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])
const title = ref('')

function handleSubmit() {
  const value = title.value.trim()
  if (!value) return
  emit('add', value)
  title.value = ''
}
</script>

<template>
  <form class="add-form" @submit.prevent="handleSubmit">
    <label class="sr-only" for="new-todo">新增待办事项</label>
    <input
      id="new-todo"
      v-model="title"
      class="new-todo-input"
      type="text"
      maxlength="120"
      autocomplete="off"
      placeholder="例如：整理本周会议记录"
    />
    <button class="add-button" type="submit" :disabled="!title.trim()">
      <span aria-hidden="true">+</span>
      添加
    </button>
  </form>
</template>
