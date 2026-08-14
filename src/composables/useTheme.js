import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const THEME_STORAGE_KEY = 'vue3-todo-list-theme-mode'

export const THEME_OPTIONS = [
  { value: 'system', label: '系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

function loadThemeMode() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_OPTIONS.some((option) => option.value === savedTheme) ? savedTheme : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme() {
  const themeMode = ref(loadThemeMode())
  const systemPrefersDark = ref(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  let themeMediaQuery

  const resolvedTheme = computed(() => {
    if (themeMode.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
    return themeMode.value
  })

  watch(themeMode, (mode) => {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  })

  watch(
    resolvedTheme,
    (theme) => {
      if (typeof document === 'undefined') return
      document.documentElement.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
      document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        theme === 'dark' ? '#151725' : '#6366f1',
      )
      document.querySelector('link[rel="icon"]')?.setAttribute(
        'href',
        theme === 'dark' ? '/favicon-dark.svg' : '/favicon.svg',
      )
    },
    { immediate: true },
  )

  function updateSystemTheme(event) {
    systemPrefersDark.value = event.matches
  }

  onMounted(() => {
    themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = themeMediaQuery.matches
    themeMediaQuery.addEventListener('change', updateSystemTheme)
  })

  onBeforeUnmount(() => {
    themeMediaQuery?.removeEventListener('change', updateSystemTheme)
  })

  function setThemeMode(mode) {
    themeMode.value = mode
  }

  return {
    themeMode,
    resolvedTheme,
    THEME_OPTIONS,
    setThemeMode,
  }
}
