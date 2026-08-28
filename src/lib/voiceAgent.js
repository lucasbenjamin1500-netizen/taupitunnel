/**
 * Couche métier isolée pour brancher plus tard un SDK vocal
 * (Vapi, OpenAI Realtime, Retell, etc.).
 */

export async function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: 'unsupported' }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return { ok: true, stream }
  } catch (err) {
    const denied =
      err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
    return { ok: false, error: denied ? 'denied' : 'unavailable' }
  }
}

export function stopMicrophone(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

export async function startAgent() {
  const permission = await requestMicrophone()
  if (!permission.ok) return permission
  // Point d'injection SDK : startCall(stream)
  return permission
}

export function stopAgent(stream) {
  stopMicrophone(stream)
}
