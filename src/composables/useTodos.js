import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isWithinRetention, listRetentionDays, retentionCutoff, sameDay, startOfDay } from '../lib/dates'
import {
  LOCAL_STORAGE_KEY,
  MAX_TITLE_LENGTH,
  SYNC_CACHE_KEY,
  createId,
  dedupeTodos,
  fingerprintTodos,
  isServerId,
  normalizeTodo,
  parseCreatedAt,
  pruneExpiredTodos,
  readTodos,
  sameId,
  toRemoteDoc,
  unwrapDocs,
  writeStorage,
} from '../lib/todos'
import { useLiteDB } from './useLiteDB'

const SYNC_INTERVAL_MS = 5000

export const FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
]

function canApplyRemoteSnapshot() {
  if (typeof document === 'undefined') return true
  const active = document.activeElement
  return !(active instanceof HTMLInputElement && active.classList.contains('edit-input'))
}

export function useTodos() {
  const {
    isConnected,
    syncEnabled,
    connectionError,
    connectionEpoch,
    todosCollection,
    connect,
    markSynced,
  } = useLiteDB()

  const localTodos = ref(readTodos(LOCAL_STORAGE_KEY))
  const cloudTodos = ref(readTodos(SYNC_CACHE_KEY))
  const activeFilter = ref('all')
  const selectedDate = ref(startOfDay())
  const storageWriteFailed = ref(false)
  const syncWriteFailed = ref(false)
  const isSyncing = ref(false)

  let pollTimer = 0
  let pendingMutations = 0
  let mutationEpoch = 0

  function activeTodos() {
    return syncEnabled.value ? cloudTodos : localTodos
  }

  const todos = computed(() => activeTodos().value)

  watch(localTodos, (items) => {
    storageWriteFailed.value = !writeStorage(LOCAL_STORAGE_KEY, items)
  }, { deep: true })

  watch(cloudTodos, (items) => {
    storageWriteFailed.value = !writeStorage(SYNC_CACHE_KEY, items)
  }, { deep: true })

  const dayOptions = computed(() => listRetentionDays())
  const dayTodos = computed(() => todos.value.filter((todo) => sameDay(todo.createdAt, selectedDate.value)))
  const remainingCount = computed(() => dayTodos.value.filter((todo) => !todo.completed).length)
  const completedCount = computed(() => dayTodos.value.length - remainingCount.value)
  const totalCount = computed(() => dayTodos.value.length)
  const storedCount = computed(() => todos.value.length)

  const visibleTodos = computed(() => {
    if (activeFilter.value === 'active') return dayTodos.value.filter((todo) => !todo.completed)
    if (activeFilter.value === 'completed') return dayTodos.value.filter((todo) => todo.completed)
    return dayTodos.value
  })

  function ensureSelectedDate() {
    const today = startOfDay()
    const cutoff = retentionCutoff()
    if (selectedDate.value < cutoff || selectedDate.value > today) {
      selectedDate.value = today
    }
  }

  function pruneStore(store) {
    const next = pruneExpiredTodos(store.value)
    if (next.length !== store.value.length) store.value = next
  }

  function pruneLocalStores() {
    pruneStore(localTodos)
    pruneStore(cloudTodos)
  }

  function upsertCloudTodo(tempId, mapped) {
    if (!mapped) return
    const index = cloudTodos.value.findIndex(
      (todo) => sameId(todo.id, tempId) || sameId(todo.id, mapped.id),
    )
    if (index >= 0) {
      cloudTodos.value[index] = mapped
      return
    }
    cloudTodos.value.push(mapped)
  }

  function applyRemoteTodos(docs) {
    const mapped = pruneExpiredTodos(dedupeTodos(docs))
    const pending = cloudTodos.value.filter((todo) => !isServerId(todo.id))
    const next = pending.length ? [...mapped, ...pending] : mapped
    if (fingerprintTodos(next) === fingerprintTodos(cloudTodos.value)) {
      markSynced()
      return
    }
    cloudTodos.value = next
    markSynced()
  }

  async function fetchRemoteTodos() {
    return unwrapDocs(await todosCollection().find({}, { sort: { created_at: 1 } }))
  }

  async function pruneRemoteExpired() {
    const remote = await fetchRemoteTodos()
    const keep = []
    const expiredIds = []
    for (const doc of remote) {
      const createdAt = parseCreatedAt(doc)
      if (isWithinRetention(createdAt)) keep.push(doc)
      else if (doc.id !== undefined && doc.id !== null) expiredIds.push(doc.id)
    }
    await Promise.all(expiredIds.map((id) => todosCollection().deleteById(id)))
    return keep
  }

  async function refreshFromRemote({ force = false } = {}) {
    if (!isConnected.value || pendingMutations > 0) return false
    if (!force && (isSyncing.value || !canApplyRemoteSnapshot())) return false

    const epoch = mutationEpoch
    isSyncing.value = true
    try {
      const remote = await pruneRemoteExpired()
      if (epoch !== mutationEpoch || pendingMutations > 0) return false
      applyRemoteTodos(remote)
      ensureSelectedDate()
      syncWriteFailed.value = false
      return true
    } catch (error) {
      syncWriteFailed.value = true
      if (force) connectionError.value = error?.message || '同步失败'
      return false
    } finally {
      isSyncing.value = false
    }
  }

  async function runRemoteMutation(task) {
    pendingMutations += 1
    mutationEpoch += 1
    try {
      await task()
      syncWriteFailed.value = false
      markSynced()
    } catch {
      syncWriteFailed.value = true
    } finally {
      pendingMutations -= 1
    }
  }

  async function addTodo(title) {
    const trimmedTitle = title?.trim().slice(0, MAX_TITLE_LENGTH)
    if (!trimmedTitle) return false

    const item = {
      id: createId(),
      title: trimmedTitle,
      completed: false,
      createdAt: Date.now(),
    }
    activeTodos().value.push(item)
    selectedDate.value = startOfDay(item.createdAt)
    pruneStore(activeTodos())

    if (!isConnected.value) return true

    await runRemoteMutation(async () => {
      const saved = await todosCollection().insert(toRemoteDoc(item))
      upsertCloudTodo(item.id, normalizeTodo(unwrapDocs(saved)[0] || saved))
    })
    return true
  }

  async function removeTodo(id) {
    const store = activeTodos()
    store.value = store.value.filter((todo) => !sameId(todo.id, id))
    if (!isConnected.value || !isServerId(id)) return
    await runRemoteMutation(() => todosCollection().deleteById(id))
  }

  async function updateTodoTitle(id, newTitle) {
    const trimmedTitle = newTitle?.trim().slice(0, MAX_TITLE_LENGTH)
    if (!trimmedTitle) {
      await removeTodo(id)
      return
    }

    const todo = activeTodos().value.find((item) => sameId(item.id, id))
    if (!todo || todo.title === trimmedTitle) return
    todo.title = trimmedTitle

    if (!isConnected.value || !isServerId(id)) return
    await runRemoteMutation(() => todosCollection().updateById(id, { title: trimmedTitle }))
  }

  async function toggleTodo(id) {
    const todo = activeTodos().value.find((item) => sameId(item.id, id))
    if (!todo) return
    todo.completed = !todo.completed

    if (!isConnected.value || !isServerId(id)) return
    try {
      await runRemoteMutation(() => todosCollection().updateById(id, { completed: todo.completed }))
      if (syncWriteFailed.value) todo.completed = !todo.completed
    } catch {
      todo.completed = !todo.completed
    }
  }

  async function clearCompleted() {
    const completedIds = dayTodos.value.filter((todo) => todo.completed).map((todo) => todo.id)
    if (!completedIds.length) return
    const store = activeTodos()
    store.value = store.value.filter((todo) => !completedIds.some((id) => sameId(id, todo.id)))

    if (!isConnected.value) return
    await runRemoteMutation(async () => {
      await Promise.all(
        completedIds.filter((id) => isServerId(id)).map((id) => todosCollection().deleteById(id)),
      )
    })
  }

  function setFilter(filter) {
    activeFilter.value = filter
  }

  function setSelectedDate(value) {
    const next = startOfDay(value)
    const cutoff = retentionCutoff()
    const today = startOfDay()
    if (next < cutoff || next > today) return
    selectedDate.value = next
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== 'visible') return
    ensureSelectedDate()
    pruneLocalStores()
    refreshFromRemote()
  }

  onMounted(async () => {
    pruneLocalStores()
    ensureSelectedDate()
    if (syncEnabled.value) await connect()

    pollTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      ensureSelectedDate()
      pruneLocalStores()
      refreshFromRemote()
    }, SYNC_INTERVAL_MS)
    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onBeforeUnmount(() => {
    window.clearInterval(pollTimer)
    window.removeEventListener('focus', handleVisibilityChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  watch(connectionEpoch, async (epoch) => {
    if (epoch > 0 && isConnected.value) await refreshFromRemote({ force: true })
  })

  watch(syncEnabled, () => {
    selectedDate.value = startOfDay()
  })

  return {
    todos,
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
    isSyncing,
    addTodo,
    removeTodo,
    updateTodoTitle,
    toggleTodo,
    clearCompleted,
    setFilter,
    setSelectedDate,
  }
}
