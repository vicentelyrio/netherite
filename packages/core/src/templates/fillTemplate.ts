import type { ItemType } from '@netherite/schema'
import { frontmatterEnd } from './templateBody'
import { templates } from './templates'

export interface TemplateValues {
  readonly id: string
  readonly title: string
  readonly created: string
  readonly date: string
  readonly createdBy?: string | undefined
  readonly project?: string | undefined
  readonly goal?: string | undefined
}

const placeholder = /\{\{(\w+)\}\}/g

const readers: Readonly<Record<string, (values: TemplateValues) => string | undefined>> = {
  id: (v) => v.id,
  title: (v) => v.title,
  created: (v) => v.created,
  date: (v) => v.date,
  created_by: (v) => v.createdBy,
  project: (v) => v.project,
  goal: (v) => v.goal,
}

const valueFor = (values: TemplateValues, name: string) => readers[name]?.(values)

const optional = new Set(['created_by'])

const plain = /^[A-Za-z0-9](?:[A-Za-z0-9 _./()+-]|:(?=\S))*$/

const reservedWord = /^(?:true|false|null|yes|no|on|off|y|n|~)$/i

const looksNumeric = /^[\d.+-]+$/

const yamlScalar = (value: string) =>
  plain.test(value) && !reservedWord.test(value) && !looksNumeric.test(value) && !/ $/.test(value)
    ? value
    : JSON.stringify(value)

export class MissingTemplateValue extends Error {
  readonly _tag = 'MissingTemplateValue'
  constructor(readonly missing: string) {
    super(`The template needs a value for {{${missing}}}`)
  }
}

export const fillTemplate = (type: ItemType, values: TemplateValues): string => {
  const text = templates[type]
  const split = frontmatterEnd(text)
  const fill = (part: string, inFrontmatter: boolean) =>
    part
      .split('\n')
      .flatMap((line) => {
        const names = [...line.matchAll(placeholder)].map((m) => m[1] as string)
        const missing = names.find((n) => valueFor(values, n) === undefined)
        if (missing !== undefined) {
          if (optional.has(missing)) return []
          throw new MissingTemplateValue(missing)
        }
        return [
          line.replace(placeholder, (_, name: string) => {
            const value = valueFor(values, name) as string
            return inFrontmatter ? yamlScalar(value) : value
          }),
        ]
      })
      .join('\n')
  return fill(text.slice(0, split), true) + fill(text.slice(split), false)
}
