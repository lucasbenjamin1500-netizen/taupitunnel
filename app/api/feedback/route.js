import { NextResponse } from 'next/server'
import { saveFeedback, updateFeedback } from '@/src/lib/feedbackStore.js'
import { isValidEmail } from '@/src/lib/feedbackReport.js'

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body?.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const saved = await saveFeedback(body)
    return NextResponse.json(saved)
  } catch (error) {
    console.error('feedback save error', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const id = typeof body?.id === 'string' ? body.id : ''
    const email = typeof body?.contact_email === 'string' ? body.contact_email.trim() : ''

    if (!id || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const updated = await updateFeedback(id, { contact_email: email })
    return NextResponse.json(updated)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return NextResponse.json({ error: 'Unknown report' }, { status: 404 })
    }
    console.error('feedback update error', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
