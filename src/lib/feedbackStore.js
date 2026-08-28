import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

const DIR = path.join(process.cwd(), 'data', 'feedback')

function fileFor(id) {
  return path.join(DIR, `${id}.json`)
}

export async function saveFeedback(report) {
  try {
    await mkdir(DIR, { recursive: true })
    const file = fileFor(report.id)
    await writeFile(file, JSON.stringify(report, null, 2), 'utf8')
    console.log('Fiche enregistrée', file)
  } catch (error) {
    console.warn('Fiche non écrite sur disque', error?.code || error)
  }
  return report
}

export async function updateFeedback(id, patch) {
  try {
    const file = fileFor(id)
    const current = JSON.parse(await readFile(file, 'utf8'))
    const next = { ...current, ...patch }
    await writeFile(file, JSON.stringify(next, null, 2), 'utf8')
    return next
  } catch (error) {
    console.warn('Fiche non mise à jour sur disque', error?.code || error)
    return { id, ...patch }
  }
}
