import { useState } from 'react'
import FeedbackFiche from './FeedbackFiche.jsx'
import { isValidEmail } from '../lib/feedbackReport.js'

export default function SummaryScreen({ copy, report, onEmailSubmit }) {
  const [showFiche, setShowFiche] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const emailSaved = Boolean(report?.contact_email)

  function handleEmailSubmit(event) {
    event.preventDefault()
    const value = email.trim()
    if (!isValidEmail(value)) {
      setEmailError(copy.emailInvalid)
      return
    }
    setEmailError(null)
    onEmailSubmit?.(value)
  }

  return (
    <div
      className={`flex h-full flex-col overflow-y-auto overscroll-contain px-6 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] ${
        showFiche ? 'justify-start' : 'justify-center'
      }`}
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <svg
            className="h-8 w-8 text-emerald-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-white">{copy.thanksTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{copy.thanksBody}</p>

        {report && (
          <>
            <button
              type="button"
              onClick={() => setShowFiche((open) => !open)}
              aria-expanded={showFiche}
              className="mt-8 flex min-h-14 w-full items-center justify-center rounded-full bg-white/10 px-6 py-4 text-base font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/16 active:scale-[0.98]"
            >
              {showFiche ? copy.hideReport : copy.viewReport}
            </button>

            {showFiche ? <FeedbackFiche copy={copy} report={report} /> : null}
          </>
        )}

        <div className="mt-8 w-full border-t border-white/10 pt-6 text-left">
          <h3 className="text-base font-semibold text-white">{copy.emailTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{copy.emailPrompt}</p>

          {emailSaved ? (
            <p role="status" className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-400/25">
              {copy.emailThanks}
            </p>
          ) : (
            <form onSubmit={handleEmailSubmit} className="mt-4 flex flex-col gap-3">
              <label htmlFor="follow-up-email" className="sr-only">
                {copy.emailPrompt}
              </label>
              <input
                id="follow-up-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (emailError) setEmailError(null)
                }}
                placeholder={copy.emailPlaceholder}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'follow-up-email-error' : 'follow-up-email-hint'}
                className="min-h-14 w-full rounded-2xl bg-white/10 px-4 text-base text-white ring-1 ring-white/20 outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/50"
              />
              {emailError ? (
                <p id="follow-up-email-error" role="alert" className="text-sm text-rose-200">
                  {emailError}
                </p>
              ) : (
                <p id="follow-up-email-hint" className="text-xs text-white/40">
                  {copy.emailOptional}
                </p>
              )}
              <button
                type="submit"
                className="flex min-h-14 w-full items-center justify-center rounded-full bg-white px-6 py-4 text-base font-semibold text-[#0a1224] transition hover:bg-[#f4f1ea] active:scale-[0.98]"
              >
                {copy.emailSubmit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
