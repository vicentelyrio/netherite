import { Markdown } from '@/components/Markdown'
import { useI18nContext } from '@/infrastructure/i18n'
import { adrSections, consequencesOf } from './adr-sections'
import './AdrBody.css'

/**
 * An ADR's text laid out as the design has it: the Decision in a box that stands out, and the
 * Consequences in two columns, what gets better and what costs. Text that does not follow the
 * Context, Decision, Consequences shape is shown as it is.
 */
export function AdrBody({ source }: { readonly source: string }) {
  const { LL } = useI18nContext()
  const { intro, sections } = adrSections(source)
  const named = (title: string) => (s: { title: string }) => s.title.toLowerCase() === title
  if (!sections.some(named('decision'))) return <Markdown source={source} />
  return (
    <div className="adr-body">
      {intro.trim() !== '' && <Markdown source={intro} />}
      {sections.map((s) => {
        if (named('decision')(s)) {
          return (
            <section key={s.title} className="adr-decision" aria-label={s.title}>
              <Markdown source={s.text} />
            </section>
          )
        }
        const consequences = named('consequences')(s) ? consequencesOf(s.text) : undefined
        if (consequences === undefined) return <Markdown key={s.title} source={s.text} />
        return (
          <section key={s.title} className="adr-consequences" aria-label={s.title}>
            <Markdown source={`## ${s.title}\n\n${consequences.lead}`} />
            <div className="adr-columns">
              <div className="adr-col" data-kind="good">
                <h3>{LL.knowledge.doc.main.gets()}</h3>
                <ul>
                  {consequences.good.map((t) => (
                    <li key={t}>
                      <Markdown source={t} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="adr-col" data-kind="bad">
                <h3>{LL.knowledge.doc.main.costs()}</h3>
                <ul>
                  {consequences.bad.map((t) => (
                    <li key={t}>
                      <Markdown source={t} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
