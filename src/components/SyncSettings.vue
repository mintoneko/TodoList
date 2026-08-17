<script setup>
import { nextTick, ref, watch } from 'vue'
import { useLiteDB } from '../composables/useLiteDB'

const {
  endpoint,
  apiKey,
  syncEnabled,
  isConnected,
  isConnecting,
  isSettingsOpen,
  connectionError,
  currentRole,
  saveConnection,
  disconnect,
  closeSettings,
} = useLiteDB()

const draftEndpoint = ref(endpoint.value)
const draftApiKey = ref(apiKey.value)
const showApiKey = ref(false)
const endpointInput = ref(null)

watch(isSettingsOpen, (open) => {
  if (!open) return
  draftEndpoint.value = endpoint.value
  draftApiKey.value = apiKey.value
  showApiKey.value = false
  nextTick(() => endpointInput.value?.focus())
})

async function handleSubmit() {
  await saveConnection({
    nextEndpoint: draftEndpoint.value,
    nextApiKey: draftApiKey.value,
    enabled: true,
  })
  if (isConnected.value) closeSettings()
}

function handleDisable() {
  disconnect()
  closeSettings()
}
</script>

<template>
  <div
    v-if="isSettingsOpen"
    class="modal-overlay"
    @click.self="closeSettings"
  >
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-settings-title"
    >
      <header class="modal-header">
        <div>
          <p class="eyebrow">LITEDB</p>
          <h2 id="sync-settings-title">数据同步</h2>
        </div>
        <button
          class="icon-button"
          type="button"
          aria-label="关闭同步设置"
          @click="closeSettings"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <p class="modal-lead">
        仅本地和云端同步是两套独立清单，可以随时切换，互不影响。同步模式只改云端数据，本地任务会原样留着。两种模式都只保留最近 7 天。
      </p>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <label class="field-label" for="litedb-endpoint">服务地址</label>
        <input
          id="litedb-endpoint"
          ref="endpointInput"
          v-model="draftEndpoint"
          class="new-todo-input"
          type="url"
          autocomplete="off"
          placeholder="http://localhost:3000"
        />

        <label class="field-label" for="litedb-api-key">API 密钥</label>
        <div class="secret-field">
          <input
            id="litedb-api-key"
            v-model="draftApiKey"
            class="new-todo-input"
            :type="showApiKey ? 'text' : 'password'"
            autocomplete="off"
            placeholder="write 或 admin 角色密钥"
          />
          <button
            class="secret-toggle"
            type="button"
            :aria-label="showApiKey ? '隐藏密钥' : '显示密钥'"
            @click="showApiKey = !showApiKey"
          >
            {{ showApiKey ? '隐藏' : '显示' }}
          </button>
        </div>

        <p v-if="connectionError && syncEnabled" class="modal-error" role="alert">
          {{ connectionError }}
        </p>
        <p v-else-if="isConnected" class="modal-ok" role="status">
          已连接{{ currentRole ? `，当前角色为 ${currentRole}` : '' }}。
        </p>

        <div class="modal-actions">
          <button
            v-if="syncEnabled"
            class="ghost-button"
            type="button"
            @click="handleDisable"
          >
            仅使用本地
          </button>
          <button
            class="add-button modal-submit"
            type="submit"
            :disabled="isConnecting || !draftEndpoint.trim()"
          >
            {{ isConnecting ? '连接中…' : '保存并连接' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
