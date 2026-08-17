export const DAY_MS = 24 * 60 * 60 * 1000
export const RETENTION_DAYS = 7
const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function startOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function retentionCutoff(now = Date.now()) {
  return startOfDay(now) - (RETENTION_DAYS - 1) * DAY_MS
}

export function isWithinRetention(timestamp, now = Date.now()) {
  return timestamp >= retentionCutoff(now)
}

export function sameDay(left, right) {
  return startOfDay(left) === startOfDay(right)
}

export function listRetentionDays(now = Date.now()) {
  const today = startOfDay(now)
  return Array.from({ length: RETENTION_DAYS }, (_, index) => {
    const value = today - index * DAY_MS
    return {
      value,
      label: formatDayLabel(value, today),
      dateLabel: formatDateLabel(value),
    }
  })
}

function formatDayLabel(value, today) {
  if (value === today) return '今天'
  if (value === today - DAY_MS) return '昨天'
  return WEEKDAY_LABELS[new Date(value).getDay()]
}

function formatDateLabel(value) {
  const date = new Date(value)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
