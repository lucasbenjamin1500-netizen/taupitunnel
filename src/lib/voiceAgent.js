/**
 * Couche métier isolée pour brancher plus tard un SDK vocal
 * (Vapi, OpenAI Realtime, Retell, etc.).
 */

export function isInAppBrowser() {
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|LinkedInApp|Line\/|Twitter|Snapchat|WhatsApp|Messenger/i.test(ua)
}

export async function unlockAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const context = new AudioCtx()
    if (context.state === 'suspended') await context.resume()
    const buffer = context.createBuffer(1, 1, 22050)
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.start(0)
  } catch {
    /* iOS peut ignorer ; le micro reste le point critique */
  }
}

export async function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: isInAppBrowser() ? 'inapp' : 'unsupported' }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return { ok: true, stream }
  } catch (err) {
    const denied =
      err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
    if (denied) return { ok: false, error: 'denied' }
    if (isInAppBrowser()) return { ok: false, error: 'inapp' }
    return { ok: false, error: 'unavailable' }
  }
}

export function stopMicrophone(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

export async function startAgent() {
  const permission = await requestMicrophone()
  if (!permission.ok) return permission
  return permission
}

export function stopAgent(stream) {
  stopMicrophone(stream)
}

export function isIOS() {
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function describeVapiError(error) {
  const seen = new Set()

  function unwrap(value) {
    if (!value || seen.has(value)) return ''
    if (typeof value === 'string') return value
    if (typeof value !== 'object') return ''
    seen.add(value)
    if (typeof value.message === 'string') return value.message
    if (typeof value.msg === 'string') return value.msg
    if (typeof value.errorMsg === 'string') return value.errorMsg
    if (value instanceof Error) return value.message
    return unwrap(value.message) || unwrap(value.error)
  }

  return unwrap(error) || (typeof error?.type === 'string' ? error.type : '')
}

export function isExpectedCallEndError(error) {
  const nestedType = error?.error?.error?.type || error?.error?.message?.type
  const text = [
    error?.type,
    nestedType,
    describeVapiError(error),
    error?.error?.errorMsg,
  ]
    .filter(Boolean)
    .join(' ')
  return /ejected|meeting has ended|meeting-ended|left-meeting/i.test(text)
}

export function isHostBridgeError(error) {
  const text = [
    error?.message,
    error?.reason?.message,
    typeof error === 'string' ? error : '',
  ]
    .filter(Boolean)
    .join(' ')
  return /tabs:outgoing\.message\.ready|no listener/i.test(text)
}

export function isMicDeniedError(error) {
  const text = [
    error?.name,
    error?.message,
    error?.error?.message,
    error?.errorMsg,
  ]
    .filter(Boolean)
    .join(' ')
  return /notallowed|permission|microphone|getusermedia|denied/i.test(text)
}

