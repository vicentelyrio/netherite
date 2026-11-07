import { Markdown } from '@/components/Markdown'
import { useI18nContext } from '@/infrastructure/i18n'
import { adrSections, consequencesOf } from './adr-sections'
import './AdrBody.css'

export function AdrBody({ source }: { readonly source: string }) {
  const { LL } = useI18nContext()
  const { intro, sections } = adrSections(source)
  return (
    <div className="adr-body">
      {intro.trim() !== '' && <Markdown source={intro} />}
      {sections.map((s) => {
        const consequences =
          s.title.toLowerCase() === 'consequences' ? consequencesOf(s.text) : undefined
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
