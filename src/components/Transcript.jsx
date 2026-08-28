export default function Transcript({ text }) {
  if (!text) return null

  return (
    <p
      aria-live="polite"
      className="max-w-sm text-center text-base leading-relaxed text-white/90"
    >
      {text}
    </p>
  )
}
