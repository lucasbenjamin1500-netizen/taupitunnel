function MicIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18v3" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  )
}

export default function VoiceButton({
  conversationState,
  onClick,
  disabled = false,
  isCallActive = false,
  isConnecting = false,
  labels,
}) {
  const isListening = conversationState === 'listening'
  const isProcessing = conversationState === 'processing'
  const showStop = isCallActive && !isProcessing
  const isDisabled = disabled || isProcessing

  const text = isProcessing
    ? labels.processing
    : isConnecting
      ? labels.connecting
      : showStop
        ? labels.stop
        : labels.start

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={showStop || isListening}
      className={`flex min-h-14 w-full max-w-sm items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-semibold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg ${
        showStop
          ? 'bg-red-600 text-white shadow-[0_8px_28px_rgba(220,38,38,0.45)] hover:bg-red-500'
          : 'bg-white text-[#0a1224] shadow-[0_8px_28px_rgba(10,18,36,0.35)] hover:bg-[#f4f1ea]'
      }`}
    >
      {showStop ? <StopIcon /> : <MicIcon />}
      <span>{text}</span>
    </button>
  )
}
