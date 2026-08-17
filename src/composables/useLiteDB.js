import { computed, ref } from 'vue'
import { LiteDB } from '../lib/litedb'

const CONFIG_KEY = 'vue3-todo-list-litedb'
const DEFAULT_API_KEY = import.meta.env.VITE_LITEDB_API_KEY || ''

function defaultEndpoint() {
  const fromEnv = import.meta.env.VITE_LITEDB_ENDPOINT
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin
    }
  }
  return 'http://localhost:3000'
}

function readConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) {
      return {
        endpoint: defaultEndpoint(),
        apiKey: DEFAULT_API_KEY,
        enabled: Boolean(DEFAULT_API_KEY),
      }
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { endpoint: defaultEndpoint(), apiKey: DEFAULT_API_KEY, enabled: false }
    }
    return {
      endpoint:
        typeof parsed.endpoint === 'string' && parsed.endpoint.trim()
          ? parsed.endpoint.trim().replace(/\/$/, '')
          : defaultEndpoint(),
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : DEFAULT_API_KEY,
      enabled: Boolean(parsed.enabled),
    }
  } catch {
    return { endpoint: defaultEndpoint(), apiKey: DEFAULT_API_KEY, enabled: false }
  }
}

function writeConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

function formatConnectionError(error) {
  const message = error?.message || String(error || '')
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('Load failed')) {
    return '无法连接到 LiteDB 服务，请确认服务已启动且地址正确。'
  }
  if (message.includes('timed out')) {
    return '连接 LiteDB 超时，请检查服务地址和网络。'
  }
  if (message.includes('未授权') || message.includes('Invalid') || message.includes('API')) {
    return message
  }
  return message || '连接失败'
}

const saved = readConfig()
const endpoint = ref(saved.endpoint)
const apiKey = ref(saved.apiKey)
const syncEnabled = ref(saved.enabled)
const isConnected = ref(false)
const isConnecting = ref(false)
const isSettingsOpen = ref(false)
const connectionError = ref('')
const currentRole = ref('')
const lastSyncedAt = ref(null)
const connectionEpoch = ref(0)

let client = null

function createClient() {
  const resolvedEndpoint = endpoint.value || (typeof window !== 'undefined' ? window.location.origin : defaultEndpoint())
  return new LiteDB({
    endpoint: resolvedEndpoint,
    apiKey: apiKey.value || undefined,
    timeout: 12000,
  })
}

export function useLiteDB() {
  function getClient() {
    if (!client) client = createClient()
    return client
  }

  function todosCollection() {
    return getClient().collection('todos')
  }

  function persistConnection() {
    writeConfig({
      endpoint: endpoint.value,
      apiKey: apiKey.value,
      enabled: syncEnabled.value,
    })
  }

  async function connect() {
    if (!syncEnabled.value) {
      isConnected.value = false
      return false
    }

    isConnecting.value = true
    connectionError.value = ''
    client = createClient()

    try {
      const verified = await client.verifyAuth()
      isConnected.value = true
      currentRole.value = verified?.role || ''
      connectionEpoch.value += 1
      return true
    } catch (error) {
      isConnected.value = false
      currentRole.value = ''
      connectionError.value = formatConnectionError(error)
      return false
    } finally {
      isConnecting.value = false
    }
  }

  function disconnect() {
    syncEnabled.value = false
    isConnected.value = false
    currentRole.value = ''
    connectionError.value = ''
    lastSyncedAt.value = null
    persistConnection()
    client = null
  }

  async function saveConnection({ nextEndpoint, nextApiKey, enabled = true }) {
    endpoint.value = (nextEndpoint || defaultEndpoint()).trim().replace(/\/$/, '') || defaultEndpoint()
    apiKey.value = (nextApiKey || '').trim()
    syncEnabled.value = enabled
    persistConnection()
    if (!enabled) {
      disconnect()
      return false
    }
    return connect()
  }

  function openSettings() {
    isSettingsOpen.value = true
  }

  function closeSettings() {
    isSettingsOpen.value = false
  }

  function markSynced() {
    lastSyncedAt.value = Date.now()
  }

  const connectionLabel = computed(() => {
    if (isConnecting.value) return '正在连接'
    if (isConnected.value) return '已同步'
    if (syncEnabled.value && connectionError.value) return '同步失败'
    if (syncEnabled.value) return '未连接'
    return '仅本地'
  })

  const connectionTone = computed(() => {
    if (isConnecting.value) return 'pending'
    if (isConnected.value) return 'online'
    if (syncEnabled.value && connectionError.value) return 'error'
    return 'local'
  })

  return {
    endpoint,
    apiKey,
    syncEnabled,
    isConnected,
    isConnecting,
    isSettingsOpen,
    connectionError,
    currentRole,
    lastSyncedAt,
    connectionEpoch,
    connectionLabel,
    connectionTone,
    getClient,
    todosCollection,
    connect,
    disconnect,
    saveConnection,
    openSettings,
    closeSettings,
    markSynced,
  }
}
