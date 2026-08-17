import { isWithinRetention } from './dates'

export const LOCAL_STORAGE_KEY = 'vue3-todo-list-items'
export const SYNC_CACHE_KEY = 'vue3-todo-list-sync-cache'
export const MAX_TITLE_LENGTH = 120

export function createId() {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function isServerId(id) {
  return id !== undefined && id !== null && /^\d+$/.test(String(id))
}

export function sameId(left, right) {
  return String(left) === String(right)
}

export function parseCreatedAt(todo) {
  if (typeof todo.createdAt === 'number' && Number.isFinite(todo.createdAt) && todo.createdAt >= 0) {
    return todo.createdAt
  }
  if (typeof todo.created_at === 'string') {
    const parsed = Date.parse(todo.created_at)
    if (Number.isFinite(parsed)) return parsed
  }
  return Date.now()
}

export function normalizeTodo(todo) {
  if (!todo || typeof todo !== 'object' || Array.isArray(todo) || typeof todo.title !== 'string') {
    return null
  }

  const title = todo.title.trim().slice(0, MAX_TITLE_LENGTH)
  if (!title) return null

  const rawId = todo.id
  const id =
    rawId !== undefined && rawId !== null && String(rawId).trim()
      ? String(rawId).trim()
      : createId()

  return {
    id,
    title,
    completed: typeof todo.completed === 'boolean' ? todo.completed : false,
    createdAt: parseCreatedAt(todo),
  }
}

export function toRemoteDoc(todo) {
  return {
    title: todo.title,
    completed: todo.completed,
    createdAt: todo.createdAt,
  }
}

export function fingerprintTodos(items) {
  return items
    .map((todo) => `${todo.id}:${todo.completed ? 1 : 0}:${todo.title}:${todo.createdAt}`)
    .join('|')
}

export function dedupeTodos(items) {
  const usedIds = new Set()
  return items.reduce((result, todo) => {
    const normalizedTodo = normalizeTodo(todo)
    if (!normalizedTodo) return result

    while (usedIds.has(normalizedTodo.id)) {
      normalizedTodo.id = createId()
    }
    usedIds.add(normalizedTodo.id)
    result.push(normalizedTodo)
    return result
  }, [])
}

export function pruneExpiredTodos(items, now = Date.now()) {
  return items.filter((todo) => isWithinRetention(todo.createdAt, now))
}

export function readTodos(key) {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(savedTodos)) return []
    return pruneExpiredTodos(dedupeTodos(savedTodos))
  } catch {
    return []
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function unwrapDocs(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (payload && typeof payload === 'object' && typeof payload.title === 'string') return [payload]
  return []
}
