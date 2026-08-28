'use client'

import { useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import Avatar from './components/Avatar.jsx'
import LanguageSelect from './components/LanguageSelect.jsx'
import SummaryScreen from './components/SummaryScreen.jsx'
import VoiceButton from './components/VoiceButton.jsx'
import { COPY } from './copy.js'
import {
  attachContactEmail,
  createFallbackReport,
  createSessionId,
} from './lib/feedbackReport.js'
import { loadSession, saveSession } from './lib/sessionStore.js'
import { formatTranscript, ingestVapiMessage } from './lib/transcript.js'
import { getAssistantOverrides } from './lib/vapiConfig.js'
import {
  startAgent,
  stopAgent,
  unlockAudio,
  isMicDeniedError,
  isIOS,
  describeVapiError,
  isExpectedCallEndError,
  isHostBridgeError,
} from './lib/voiceAgent.js'

const screenTransition =
  'absolute inset-0 flex flex-col transition-all duration-500 ease-out motion-reduce:transition-none'

export default function App() {
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_KEY
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
  const vapiRef = useRef(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [conversationState, setConversationState] = useState('idle')
  const [isCallActive, setIsCallActive] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [micError, setMicError] = useState(null)
  const [isRequestingMic, setIsRequestingMic] = useState(false)
  const conversationRef = useRef([])
  const analyzeRef = useRef(null)
  const sessionIdRef = useRef(createSessionId())
  const previewStreamRef = useRef(null)
  const lastVapiErrorRef = useRef('')
  const endingRef = useRef(false)
  const micPrefetchRef = useRef(null)
  const copyRef = useRef(COPY.fr)

  const copy = COPY[selectedLanguage] ?? COPY.fr
  copyRef.current = copy
  const showAgent = Boolean(selectedLanguage)
  const showSummary = conversationState === 'summary'

  useEffect(() => {
    document.documentElement.lang = selectedLanguage ?? 'fr'
  }, [selectedLanguage])

  async function analyzeConversation(messages, language = selectedLanguage) {
    setConversationState('processing')
    const fullTranscript = formatTranscript(messages)
    const meta = { id: sessionIdRef.current, langue: language === 'en' ? 'en' : 'fr' }
    saveSession({
      language: language || 'fr',
      phase: 'processing',
      sessionId: meta.id,
      messages: messages ?? [],
    })

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          language: meta.langue,
          id: meta.id,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'analyze failed')
      console.log('Fiche retour Eurotunnel', data)
      setFeedback(data)
      saveSession({ phase: 'summary', report: data })
    } catch (error) {
      console.error('Analyse impossible', error)
      const fallback = createFallbackReport(meta)
      console.log('Fiche retour Eurotunnel (fallback)', fallback)
      setFeedback(fallback)
      saveSession({ phase: 'summary', report: fallback })
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallback),
      }).catch((saveError) => console.error('Fiche fallback non enregistrée', saveError))
    } finally {
      setConversationState('summary')
    }
  }

  analyzeRef.current = analyzeConversation

  useEffect(() => {
    const restored = loadSession()
    if (restored?.sessionId) sessionIdRef.current = restored.sessionId
    if (Array.isArray(restored?.messages)) conversationRef.current = restored.messages

    if (restored?.language) {
      setSelectedLanguage(restored.language)
      if (restored.phase === 'summary' && restored.report) {
        setFeedback(restored.report)
        setConversationState('summary')
      } else if (restored.phase === 'processing') {
        setConversationState('processing')
        analyzeConversation(restored.messages || [], restored.language)
      }
    }

    setSessionReady(true)
  }, [])

  useEffect(() => {
    const onUnhandled = (event) => {
      if (isHostBridgeError(event.reason) || isHostBridgeError(event)) {
        event.preventDefault()
      }
    }
    const onError = (event) => {
      if (isHostBridgeError(event.error) || isHostBridgeError(event.message)) {
        event.preventDefault()
      }
    }
    window.addEventListener('unhandledrejection', onUnhandled)
    window.addEventListener('error', onError)
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandled)
      window.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    if (!vapiKey) return undefined

    const vapi = new Vapi(vapiKey)
    vapiRef.current = vapi

    const onCallStart = () => {
      endingRef.current = false
      conversationRef.current = []
      sessionIdRef.current = createSessionId()
      setFeedback(null)
      setIsCallActive(true)
      setMicError(null)
      setConversationState('idle')
      saveSession({
        phase: 'call',
        sessionId: sessionIdRef.current,
        messages: [],
        report: null,
      })
    }

    const onSpeechStart = () => {
      setConversationState((current) =>
        current === 'processing' || current === 'summary' ? current : 'speaking',
      )
    }

    const onSpeechEnd = () => {
      setConversationState((current) =>
        current === 'processing' || current === 'summary' ? current : 'listening',
      )
    }

    const onLocalVolumeLevel = (volume) => {
      if (volume > 0.18) {
        setConversationState((current) =>
          current === 'speaking' || current === 'processing' || current === 'summary'
            ? current
            : 'listening',
        )
      }
    }

    const onCallEnd = () => {
      if (endingRef.current) return
      endingRef.current = true
      stopAgent(previewStreamRef.current)
      previewStreamRef.current = null
      setIsCallActive(false)
      setConversationState('processing')
      const messages = conversationRef.current
      saveSession({ phase: 'processing', messages })
      window.setTimeout(() => {
        if (analyzeRef.current) analyzeRef.current(messages)
      }, 400)
    }

    const onMessage = (message) => handleAgentMessage(message)

    const onError = (error) => {
      if (isExpectedCallEndError(error) || isHostBridgeError(error)) return
      console.error('Vapi error', error)
      lastVapiErrorRef.current = describeVapiError(error)
    }

    vapi.on('call-start', onCallStart)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)
    vapi.on('local-volume-level', onLocalVolumeLevel)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('error', onError)

    return () => {
      vapi.removeListener('call-start', onCallStart)
      vapi.removeListener('speech-start', onSpeechStart)
      vapi.removeListener('speech-end', onSpeechEnd)
      vapi.removeListener('local-volume-level', onLocalVolumeLevel)
      vapi.removeListener('call-end', onCallEnd)
      vapi.removeListener('message', onMessage)
      vapi.removeListener('error', onError)
      vapi.stop()
      stopAgent(previewStreamRef.current)
      vapiRef.current = null
    }
  }, [vapiKey])

  function startVoiceAgent() {
    const vapi = vapiRef.current
    if (!vapi || !vapiAssistantId) return Promise.reject(new Error('missing-vapi-config'))
    return vapi.start(vapiAssistantId, getAssistantOverrides(selectedLanguage))
  }

  function stopVoiceAgent() {
    vapiRef.current?.stop()
  }

  function handleAgentMessage(message) {
    const previous = conversationRef.current
    conversationRef.current = ingestVapiMessage(previous, message)
    if (conversationRef.current !== previous) {
      saveSession({ messages: conversationRef.current })
    }

    if (message?.type === 'speech-update' && message.role === 'user' && message.status === 'started') {
      setConversationState((current) =>
        current === 'processing' || current === 'summary' ? current : 'listening',
      )
    }

    if (message?.type === 'transcript' && message.role === 'user' && message.transcript) {
      setConversationState((current) =>
        current === 'processing' || current === 'summary' ? current : 'listening',
      )
    }
  }

  async function prefetchMicrophone() {
    await unlockAudio()
    const permission = await startAgent()
    if (!permission.ok) return permission
    if (isIOS()) {
      previewStreamRef.current = permission.stream
    } else {
      stopAgent(permission.stream)
      previewStreamRef.current = null
    }
    return permission
  }

  function handleLanguageSelect(code) {
    setSelectedLanguage(code)
    saveSession({ language: code, phase: 'idle' })
    const labels = COPY[code] ?? COPY.fr
    micPrefetchRef.current = prefetchMicrophone()
    micPrefetchRef.current.then((permission) => {
      if (permission.ok) return
      const messages = {
        inapp: labels.micInApp,
        unsupported: labels.micUnsupported,
        denied: labels.micDenied,
      }
      setMicError(messages[permission.error] ?? labels.micDenied)
    })
  }

  async function toggleConversation() {
    if (isRequestingMic || conversationState === 'processing' || conversationState === 'summary') {
      return
    }

    if (isCallActive) {
      stopVoiceAgent()
      return
    }

    if (!vapiKey || !vapiAssistantId) {
      setMicError(copy.vapiMissing)
      return
    }

    setMicError(null)
    lastVapiErrorRef.current = ''
    setIsRequestingMic(true)

    const permission = await (micPrefetchRef.current || prefetchMicrophone())
    if (!permission.ok) {
      setIsRequestingMic(false)
      micPrefetchRef.current = null
      const messages = {
        inapp: copy.micInApp,
        unsupported: copy.micUnsupported,
        denied: copy.micDenied,
      }
      setMicError(messages[permission.error] ?? copy.micDenied)
      return
    }

    try {
      const call = await startVoiceAgent()
      if (!call) {
        stopAgent(previewStreamRef.current)
        previewStreamRef.current = null
        const detail = lastVapiErrorRef.current
        setMicError(detail ? `${copy.startError} (${detail})` : copy.startError)
        setConversationState('idle')
        return
      }
      setIsCallActive(true)
      saveSession({ language: selectedLanguage, phase: 'call' })
    } catch (error) {
      console.error('Start call failed', error)
      stopAgent(previewStreamRef.current)
      previewStreamRef.current = null
      const detail = describeVapiError(error) || lastVapiErrorRef.current
      setMicError(
        isMicDeniedError(error)
          ? copy.micDenied
          : detail
            ? `${copy.startError} (${detail})`
            : copy.startError,
      )
      setConversationState('idle')
    } finally {
      setIsRequestingMic(false)
    }
  }

  function handleEmailSubmit(email) {
    setFeedback((current) => {
      if (!current) return current
      const updated = attachContactEmail(current, email)
      saveSession({ report: updated })
      fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: updated.id, contact_email: email }),
      }).catch((error) => console.error('Email non enregistré', error))
      return updated
    })
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_-10%,#3d1a4a_0%,#0a1224_48%,#07101c_100%)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(122,31,61,0.18)_55%,rgba(10,18,36,0.55)_100%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 flex shrink-0 items-center justify-center px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-sm font-medium tracking-[0.28em] text-white/80 uppercase">
          Taupitunnel
        </h1>
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        <section
          aria-hidden={!sessionReady || showAgent}
          className={`${screenTransition} ${
            sessionReady && !showAgent
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-3 opacity-0'
          }`}
        >
          <LanguageSelect onSelect={handleLanguageSelect} />
        </section>

        <section
          aria-hidden={!showAgent || showSummary}
          className={`${screenTransition} ${
            showAgent && !showSummary
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
            <Avatar conversationState={conversationState} />
            <p className="sr-only" aria-live="polite">
              {copy.sr[conversationState] ?? copy.sr.idle}
            </p>
          </main>

          <footer className="flex shrink-0 flex-col items-center gap-3 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4">
            <VoiceButton
              conversationState={conversationState}
              isCallActive={isCallActive}
              isConnecting={isRequestingMic}
              onClick={toggleConversation}
              disabled={isRequestingMic}
              labels={copy}
            />

            {micError ? (
              <p
                role="alert"
                className="max-w-xs rounded-2xl bg-white/8 px-4 py-3 text-center text-sm leading-relaxed text-[#f0c9d4] ring-1 ring-[#e8b4c4]/35"
              >
                {micError}
              </p>
            ) : (
              <p className="max-w-xs text-center text-sm text-white/55">
                {copy.hints[conversationState] ?? copy.hints.idle}
              </p>
            )}
          </footer>
        </section>

        <section
          aria-hidden={!showSummary}
          className={`${screenTransition} min-h-0 ${
            showSummary
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <SummaryScreen
            copy={copy}
            report={feedback}
            onEmailSubmit={handleEmailSubmit}
          />
        </section>
      </div>
    </div>
  )
}
