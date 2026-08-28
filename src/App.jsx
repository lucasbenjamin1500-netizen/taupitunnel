'use client'

import { useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import Avatar from './components/Avatar.jsx'
import LanguageSelect from './components/LanguageSelect.jsx'
import SummaryScreen from './components/SummaryScreen.jsx'
import Transcript from './components/Transcript.jsx'
import VoiceButton from './components/VoiceButton.jsx'
import { COPY } from './copy.js'
import {
  attachContactEmail,
  createFallbackReport,
  createSessionId,
} from './lib/feedbackReport.js'
import { formatTranscript, ingestVapiMessage } from './lib/transcript.js'
import { getAssistantOverrides } from './lib/vapiConfig.js'
import { startAgent, stopAgent, unlockAudio, isMicDeniedError } from './lib/voiceAgent.js'

const screenTransition =
  'absolute inset-0 flex flex-col transition-all duration-500 ease-out motion-reduce:transition-none'

export default function App() {
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_KEY
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
  const vapiRef = useRef(null)

  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [conversationState, setConversationState] = useState('idle')
  const [isCallActive, setIsCallActive] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [micError, setMicError] = useState(null)
  const [isRequestingMic, setIsRequestingMic] = useState(false)
  const conversationRef = useRef([])
  const analyzeRef = useRef(null)
  const sessionIdRef = useRef(createSessionId())
  const previewStreamRef = useRef(null)
  const copyRef = useRef(COPY.fr)

  const copy = COPY[selectedLanguage] ?? COPY.fr
  copyRef.current = copy
  const showAgent = Boolean(selectedLanguage)
  const showSummary = conversationState === 'summary'

  useEffect(() => {
    document.documentElement.lang = selectedLanguage ?? 'fr'
  }, [selectedLanguage])

  async function analyzeConversation(messages) {
    setConversationState('processing')
    const fullTranscript = formatTranscript(messages)
    const meta = { id: sessionIdRef.current, langue: selectedLanguage === 'en' ? 'en' : 'fr' }

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
    } catch (error) {
      console.error('Analyse impossible', error)
      const fallback = createFallbackReport(meta)
      console.log('Fiche retour Eurotunnel (fallback)', fallback)
      setFeedback(fallback)
    } finally {
      setConversationState('summary')
    }
  }

  analyzeRef.current = analyzeConversation

  function attachVapiListeners(vapi) {
    const onCallStart = () => {
      conversationRef.current = []
      sessionIdRef.current = createSessionId()
      setFeedback(null)
      setIsCallActive(true)
      setMicError(null)
      setConversationState('idle')
    }

    const onSpeechStart = () => {
      setConversationState('speaking')
    }

    const onVolumeLevel = (volume) => {
      if (volume > 0.08) setConversationState('speaking')
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
      stopAgent(previewStreamRef.current)
      previewStreamRef.current = null
      setIsCallActive(false)
      setConversationState('processing')
      if (analyzeRef.current) analyzeRef.current(conversationRef.current)
    }

    const onMessage = (message) => handleAgentMessage(message)

    const onError = (error) => {
      console.error('Vapi error', error)
      const type = String(error?.type || '')
      const fatal =
        isMicDeniedError(error) ||
        /join|start-method|creation|validation|microphone|permission/i.test(type)
      if (!fatal) return

      stopAgent(previewStreamRef.current)
      previewStreamRef.current = null
      setIsCallActive(false)
      setIsRequestingMic(false)
      setMicError(isMicDeniedError(error) ? copyRef.current.micDenied : copyRef.current.startError)
      setConversationState((current) => (current === 'summary' ? current : 'idle'))
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-start-success', onCallStart)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('volume-level', onVolumeLevel)
    vapi.on('local-volume-level', onLocalVolumeLevel)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('error', onError)
  }

  useEffect(() => {
    return () => {
      vapiRef.current?.removeAllListeners()
      vapiRef.current?.stop()
      stopAgent(previewStreamRef.current)
    }
  }, [])

  function createVapi(audioTrack) {
    if (vapiRef.current) {
      vapiRef.current.removeAllListeners()
      void vapiRef.current.stop()
    }

    const vapi = new Vapi(
      vapiKey,
      undefined,
      { alwaysIncludeMicInPermissionPrompt: true },
      audioTrack ? { audioSource: audioTrack } : undefined,
    )
    attachVapiListeners(vapi)
    vapiRef.current = vapi
    return vapi
  }

  function startVoiceAgent(audioTrack) {
    if (!vapiKey || !vapiAssistantId) return Promise.reject(new Error('missing-vapi-config'))

    const vapi = createVapi(audioTrack)
    const assistantOverrides = getAssistantOverrides(selectedLanguage)
    return vapi.start(vapiAssistantId, assistantOverrides)
  }

  function stopVoiceAgent() {
    vapiRef.current?.stop()
  }

  function handleAgentMessage(message) {
    conversationRef.current = ingestVapiMessage(conversationRef.current, message)

    if (message?.type === 'speech-update' && message.role === 'user' && message.status === 'started') {
      setConversationState((current) => (current === 'speaking' ? current : 'listening'))
    }

    if (message?.type === 'transcript' && message.transcript) {
      setTranscript(message.transcript)
      if (message.role === 'user') {
        setConversationState((current) => (current === 'speaking' ? current : 'listening'))
      }
      if (message.role === 'assistant') {
        setConversationState('speaking')
      }
    }
  }

  async function toggleConversation() {
    if (
      isRequestingMic ||
      conversationState === 'processing' ||
      conversationState === 'speaking' ||
      conversationState === 'summary'
    ) {
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
    setIsRequestingMic(true)

    const permission = await startAgent()
    if (!permission.ok) {
      setIsRequestingMic(false)
      const messages = {
        inapp: copy.micInApp,
        unsupported: copy.micUnsupported,
        denied: copy.micDenied,
      }
      setMicError(messages[permission.error] ?? copy.micDenied)
      return
    }

    previewStreamRef.current = permission.stream
    await unlockAudio()

    const audioTrack = permission.stream.getAudioTracks()[0]
    if (!audioTrack) {
      stopAgent(permission.stream)
      previewStreamRef.current = null
      setIsRequestingMic(false)
      setMicError(copy.startError)
      return
    }

    try {
      const call = await startVoiceAgent(audioTrack)
      if (!call) {
        stopAgent(previewStreamRef.current)
        previewStreamRef.current = null
        setMicError(copy.startError)
        setConversationState('idle')
        return
      }
      setIsCallActive(true)
    } catch (error) {
      console.error('Start call failed', error)
      stopAgent(previewStreamRef.current)
      previewStreamRef.current = null
      setMicError(isMicDeniedError(error) ? copy.micDenied : copy.startError)
      setConversationState('idle')
    } finally {
      setIsRequestingMic(false)
    }
  }

  function handleEmailSubmit(email) {
    setFeedback((current) => {
      if (!current) return current
      const updated = attachContactEmail(current, email)
      console.log('Fiche retour Eurotunnel (suivi)', updated)
      return updated
    })
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_-10%,#3d1a4a_0%,#0a1224_48%,#07101c_100%)]">
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
          aria-hidden={showAgent}
          className={`${screenTransition} ${
            showAgent
              ? 'pointer-events-none -translate-y-3 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <LanguageSelect onSelect={setSelectedLanguage} />
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
            {transcript && conversationState !== 'summary' && <Transcript text={transcript} />}

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
