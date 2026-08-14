import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'vue3-todo-list-items'
const MAX_TITLE_LENGTH = 120

export const FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
]

function createId() {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTodo(todo) {
  if (
    !todo ||
    typeof todo !== 'object' ||
    Array.isArray(todo) ||
    typeof todo.title !== 'string'
  ) {
    return null
  }

  const title = todo.title.trim().slice(0, MAX_TITLE_LENGTH)
  if (!title) return null

  return {
    id: typeof todo.id === 'string' && todo.id.trim() ? todo.id.trim() : createId(),
    title,
    completed: typeof todo.completed === 'boolean' ? todo.completed : false,
    createdAt:
      typeof todo.createdAt === 'number' && Number.isFinite(todo.createdAt) && todo.createdAt >= 0
        ? todo.createdAt
        : Date.now(),
  }
}

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(savedTodos)) return []

    const usedIds = new Set()
    return savedTodos.reduce((items, todo) => {
      const normalizedTodo = normalizeTodo(todo)
      if (!normalizedTodo) return items

      while (usedIds.has(normalizedTodo.id)) {
        normalizedTodo.id = createId()
      }
      usedIds.add(normalizedTodo.id)
      items.push(normalizedTodo)
      return items
    }, [])
  } catch {
    return []
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function useTodos() {
  const todos = ref(loadTodos())
  const activeFilter = ref('all')
  const storageWriteFailed = ref(false)

  function persistTodos(items) {
    try {
      storageWriteFailed.value = !writeStorage(STORAGE_KEY, JSON.stringify(items))
    } catch {
      storageWriteFailed.value = true
    }
  }

  watch(
    todos,
    persistTodos,
    { deep: true, immediate: true },
  )

  const remainingCount = computed(() => todos.value.filter((todo) => !todo.completed).length)
  const completedCount = computed(() => todos.value.length - remainingCount.value)
  const totalCount = computed(() => todos.value.length)

  const visibleTodos = computed(() => {
    if (activeFilter.value === 'active') return todos.value.filter((todo) => !todo.completed)
    if (activeFilter.value === 'completed') return todos.value.filter((todo) => todo.completed)
    return todos.value
  })

  function addTodo(title) {
    const trimmedTitle = title?.trim().slice(0, MAX_TITLE_LENGTH)
    if (!trimmedTitle) return false

    todos.value.push({
      id: createId(),
      title: trimmedTitle,
      completed: false,
      createdAt: Date.now(),
    })
    return true
  }

  function removeTodo(id) {
    todos.value = todos.value.filter((todo) => todo.id !== id)
  }

  function updateTodoTitle(id, newTitle) {
    const trimmedTitle = newTitle?.trim().slice(0, MAX_TITLE_LENGTH)
    if (!trimmedTitle) {
      removeTodo(id)
      return
    }
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      todo.title = trimmedTitle
    }
  }

  function toggleTodo(id) {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  function clearCompleted() {
    todos.value = todos.value.filter((todo) => !todo.completed)
  }

  function setFilter(filter) {
    activeFilter.value = filter
  }

  return {
    todos,
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
    toggleTodo,
    clearCompleted,
    setFilter,
  }
}
