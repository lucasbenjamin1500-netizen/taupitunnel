function FicheSection({ title, children }) {
  return (
    <section className="mt-4">
      <h4 className="text-xs font-medium tracking-wide text-white/45 uppercase">{title}</h4>
      <div className="mt-1.5 text-sm leading-relaxed text-white/85">{children}</div>
    </section>
  )
}

function BulletList({ items, emptyLabel }) {
  if (!items?.length) {
    return <p className="text-white/40">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/50" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function FeedbackFiche({ copy, report }) {
  const sentimentColor = {
    Positif: 'text-emerald-300',
    Neutre: 'text-white/80',
    Négatif: 'text-rose-300',
  }[report?.sentiment_global] ?? 'text-white/80'

  const themeLabels = copy.themeLabels ?? {}

  return (
    <article className="mt-4 w-full rounded-2xl bg-white/8 px-5 py-4 text-left ring-1 ring-white/15">
      <h3 className="text-base font-semibold text-white">{copy.reportTitle}</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/45">{copy.reportIntro}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={`text-sm font-medium ${sentimentColor}`}>{report.sentiment_global}</p>
        <p className="text-sm text-white/70">
          {copy.scoreLabel} {report.note_estimee}/10
        </p>
      </div>

      {report.resume ? (
        <FicheSection title={copy.summaryLabel}>
          <p>{report.resume}</p>
        </FicheSection>
      ) : null}

      {report.themes?.length > 0 && (
        <FicheSection title={copy.themesLabel}>
          <div className="flex flex-wrap gap-2">
            {report.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15"
              >
                {themeLabels[theme] ?? theme}
              </span>
            ))}
          </div>
        </FicheSection>
      )}

      <FicheSection title={copy.strengthsLabel}>
        <BulletList items={report.points_forts} emptyLabel={copy.emptySection} />
      </FicheSection>

      <FicheSection title={copy.weaknessesLabel}>
        <BulletList items={report.points_faibles} emptyLabel={copy.emptySection} />
      </FicheSection>

      {report.verbatims?.length > 0 && (
        <FicheSection title={copy.quotesLabel}>
          <ul className="space-y-2">
            {report.verbatims.map((quote, index) => (
              <li key={`${quote}-${index}`} className="border-l-2 border-white/20 pl-3 text-white/70 italic">
                « {quote} »
              </li>
            ))}
          </ul>
        </FicheSection>
      )}

      {report.alerte_operationnelle && (
        <p className="mt-4 rounded-xl bg-rose-500/15 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/30">
          {copy.alertPassenger}
        </p>
      )}
    </article>
  )
}
