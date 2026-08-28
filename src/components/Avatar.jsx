const GLOW = {
  idle: 'drop-shadow(0 0 28px rgba(122, 31, 61, 0.55))',
  listening: 'drop-shadow(0 0 36px rgba(155, 45, 74, 0.85))',
  speaking: 'drop-shadow(0 0 42px rgba(142, 180, 232, 0.9))',
  processing: 'drop-shadow(0 0 28px rgba(255, 255, 255, 0.28))',
}

export default function Avatar({ conversationState = 'idle' }) {
  const isListening = conversationState === 'listening'
  const isSpeaking = conversationState === 'speaking'
  const isProcessing = conversationState === 'processing'
  const glowKey = isListening
    ? 'listening'
    : isSpeaking
      ? 'speaking'
      : isProcessing
        ? 'processing'
        : 'idle'

  return (
    <div className="relative flex items-center justify-center">
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <filter id="mascot-knockout" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    1 1 1 0 -0.1"
          />
        </filter>
      </svg>

      {isListening && (
        <>
          <span className="absolute h-80 w-80 rounded-full border border-[#e8b4c4]/40 animate-ping sm:h-96 sm:w-96" />
          <span className="absolute h-72 w-72 rounded-full border border-[#e8b4c4]/25 animate-ping [animation-delay:200ms] sm:h-[22rem] sm:w-[22rem]" />
        </>
      )}

      {isSpeaking && (
        <span className="absolute h-72 w-72 rounded-full bg-[#8eb4e8]/20 blur-xl animate-pulse sm:h-[22rem] sm:w-[22rem]" />
      )}

      {isProcessing && (
        <span className="absolute h-[19rem] w-[19rem] rounded-full border-2 border-dashed border-white/35 animate-spin sm:h-[22rem] sm:w-[22rem]" />
      )}

      <img
        src="/mascotte.png"
        alt=""
        draggable="false"
        aria-hidden="true"
        className={`relative h-72 w-72 object-contain sm:h-80 sm:w-80 ${
          isListening || isProcessing
            ? 'animate-pulse'
            : isSpeaking
              ? 'animate-speak-glow'
              : ''
        }`}
        style={{ filter: `url(#mascot-knockout) ${GLOW[glowKey]}` }}
      />
    </div>
  )
}
