import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { normalizeFeedback } from '@/src/lib/feedbackReport.js'

const SYSTEM_PROMPT = `Tu es un analyste qualité pour Eurotunnel (Le Shuttle).
À partir du transcript d'un entretien vocal avec un voyageur, tu produis UNE fiche de retour exploitable par les équipes terrain et qualité.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans commentaire, avec exactement ces clés :
{
  "sentiment_global": "Positif" | "Neutre" | "Négatif",
  "note_estimee": number,
  "resume": string,
  "themes": string[],
  "points_forts": string[],
  "points_faibles": string[],
  "verbatims": string[],
  "alerte_operationnelle": boolean,
  "gravite_alerte": "critique" | "haute" | "moyenne" | null,
  "motif_alerte": string | null,
  "equipe_cible": "operations" | "qualite" | "maintenance" | "commercial" | "surete" | "aucune"
}

Règles :
- note_estimee : nombre de 0 à 10 (une décimale possible).
- resume : 1 à 2 phrases, factuel, dans la langue du voyageur.
- themes : uniquement parmi embarquement, terminal, personnel, attente, navette, restauration, accessibilite, information, autre. 1 à 4 thèmes. Si rien n'est clair : ["autre"].
- points_forts / points_faibles : phrases courtes, dans la langue du voyageur. Tableaux vides si rien n'est dit.
- verbatims : 0 à 3 citations courtes du voyageur, langue d'origine, sans inventer.
- alerte_operationnelle = true seulement pour un problème urgent (saleté critique, panne, sécurité, file bloquée, incident, sanitaires hors service).
- Si alerte_operationnelle = false : gravite_alerte = null, motif_alerte = null, equipe_cible = "qualite" (ou "aucune" si transcript vide).
- Si alerte_operationnelle = true : gravite_alerte obligatoire, motif_alerte = une phrase précise, equipe_cible parmi operations | maintenance | surete.
- Transcript vide ou trop pauvre : sentiment_global = "Neutre", resume = "", themes = ["autre"], tableaux vides, note_estimee = 5, alerte = false, equipe_cible = "aucune".`

function createClient() {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      model: 'openai/gpt-oss-20b',
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: 'gpt-4o-mini',
    }
  }

  return null
}

function parseJson(raw) {
  if (!raw) return null
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : ''
    const langue = body?.language === 'en' ? 'en' : 'fr'
    const id = typeof body?.id === 'string' ? body.id : undefined

    const llm = createClient()
    if (!llm) {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY or OPENAI_API_KEY' },
        { status: 500 },
      )
    }

    const completion = await llm.client.chat.completions.create({
      model: llm.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Langue du voyageur : ${langue === 'en' ? 'English' : 'français'}\n\n${transcript || '(transcript vide)'}`,
        },
      ],
    })

    const parsed = parseJson(completion.choices?.[0]?.message?.content)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid model output' }, { status: 502 })
    }

    return NextResponse.json(
      normalizeFeedback(parsed, {
        id,
        langue,
        collected_at: new Date().toISOString(),
      }),
    )
  } catch (error) {
    console.error('analyze error', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
