function FlagFr() {
  return (
    <svg viewBox="0 0 24 16" className="h-5 w-7 rounded-sm shadow-sm" aria-hidden="true">
      <rect width="8" height="16" fill="#002395" />
      <rect x="8" width="8" height="16" fill="#fff" />
      <rect x="16" width="8" height="16" fill="#ed2939" />
    </svg>
  )
}

function FlagGb() {
  return (
    <svg viewBox="0 0 24 16" className="h-5 w-7 rounded-sm shadow-sm" aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M12 0 V16 M0 8 H24" stroke="#fff" strokeWidth="5.2" />
      <path d="M12 0 V16 M0 8 H24" stroke="#c8102e" strokeWidth="3" />
    </svg>
  )
}

const LANGUAGES = [
  { code: 'fr', label: 'Français', Flag: FlagFr },
  { code: 'en', label: 'English', Flag: FlagGb },
]

export default function LanguageSelect({ onSelect }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <p className="mb-1 text-center text-base text-white/80">
        Choisissez votre langue
      </p>
      <p className="mb-10 text-center text-sm text-white/45">
        Choose your language
      </p>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onSelect(lang.code)}
            className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-white/10 px-6 py-5 text-xl font-medium text-white shadow-[0_8px_32px_rgba(10,18,36,0.35)] ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/16 hover:ring-white/35 active:scale-[0.98]"
          >
            <lang.Flag />
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
