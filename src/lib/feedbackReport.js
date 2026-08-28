export const SENTIMENTS = ['Positif', 'Neutre', 'Négatif']

export const THEMES = [
  'embarquement',
  'terminal',
  'personnel',
  'attente',
  'navette',
  'restauration',
  'accessibilite',
  'information',
  'autre',
]

export const EQUIPES = [
  'operations',
  'qualite',
  'maintenance',
  'commercial',
  'surete',
  'aucune',
]

export const GRAVITES = ['critique', 'haute', 'moyenne']

function asList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function pick(allowed, value, fallback) {
  return allowed.includes(value) ? value : fallback
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `tt-${Date.now()}`
}

export function createSessionId() {
  return createId()
}

/**
 * Fiche qualité Eurotunnel : un objet unique, routable par les équipes.
 * Conservé côté serveur ; le voyageur n'en voit qu'une version lisible.
 */
export function normalizeFeedback(data, meta = {}) {
  const score = Number(data?.note_estimee)
  const alerte = Boolean(data?.alerte_operationnelle)
  const themes = asList(data?.themes)
    .map((theme) => theme.toLowerCase())
    .filter((theme) => THEMES.includes(theme))

  return {
    id: typeof meta.id === 'string' && meta.id ? meta.id : createId(),
    collected_at: meta.collected_at || new Date().toISOString(),
    langue: meta.langue === 'en' ? 'en' : 'fr',
    canal: 'nfc_shuttle',
    sentiment_global: pick(SENTIMENTS, data?.sentiment_global, 'Neutre'),
    note_estimee: Number.isFinite(score) ? Math.min(10, Math.max(0, score)) : 5,
    resume: typeof data?.resume === 'string' ? data.resume.trim() : '',
    themes: themes.length > 0 ? [...new Set(themes)] : ['autre'],
    points_forts: asList(data?.points_forts),
    points_faibles: asList(data?.points_faibles),
    verbatims: asList(data?.verbatims).slice(0, 3),
    alerte_operationnelle: alerte,
    gravite_alerte: alerte ? pick(GRAVITES, data?.gravite_alerte, 'moyenne') : null,
    motif_alerte: alerte && typeof data?.motif_alerte === 'string' ? data.motif_alerte.trim() : null,
    equipe_cible: pick(EQUIPES, data?.equipe_cible, alerte ? 'operations' : 'qualite'),
    contact_email: null,
  }
}

export function createFallbackReport(meta = {}) {
  return normalizeFeedback(
    {
      sentiment_global: 'Neutre',
      note_estimee: 5,
      resume: '',
      themes: ['autre'],
      points_forts: [],
      points_faibles: [],
      verbatims: [],
      alerte_operationnelle: false,
      gravite_alerte: null,
      motif_alerte: null,
      equipe_cible: 'aucune',
    },
    meta,
  )
}

export function attachContactEmail(report, email) {
  return {
    ...report,
    contact_email: email,
  }
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}
