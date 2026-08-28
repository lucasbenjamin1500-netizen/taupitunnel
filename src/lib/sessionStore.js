const SESSION_KEY = 'taupitunnel.session'

export function loadSession() {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveSession(patch) {
  if (typeof sessionStorage === 'undefined') return
  const current = loadSession() || {}
  const next = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) next[key] = value
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
}
