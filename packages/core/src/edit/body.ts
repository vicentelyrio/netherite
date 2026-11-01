import { type HeadingInfo, outlineMarkdown } from '@netherite/markdown'
import { Effect } from 'effect'
import { EditError } from '../errors'
import { detectEol, lineEndAfter, withEol } from './text'

/** Selects a checklist item by its position among the file's task items, or by its text. */
export type CheckSelector = number | { readonly text: string }

/**
 * Checks, unchecks or (without `checked`) toggles one checklist item. Only the character inside
 * the brackets changes.
 */
export const toggleCheck = (
  source: string,
  which: CheckSelector,
  checked?: boolean,
): Effect.Effect<string, EditError> => {
  const list = outlineMarkdown(source).checklist
  const item =
    typeof which === 'number'
      ? list[which]
      : (() => {
          const matches = list.filter((c) => c.text === which.text)
          return matches.length === 1 ? matches[0] : undefined
        })()
  if (item === undefined) {
    return Effect.fail(
      new EditError({
        reason: 'no-such-check',
        detail:
          typeof which === 'number'
            ? `There is no checklist item ${which} (the file has ${list.length})`
            : `No single checklist item has the text "${which.text}"`,
      }),
    )
  }
  const next = checked ?? !item.checked
  if (next === item.checked) return Effect.succeed(source)
  return Effect.succeed(
    `${source.slice(0, item.toggleOffset)}${next ? 'x' : ' '}${source.slice(item.toggleOffset + 1)}`,
  )
}

/** A heading to find: its text (case-insensitive), and its level to tell apart repeats. */
export type SectionSelector = string | { readonly text: string; readonly depth?: number }

const findSection = (source: string, which: SectionSelector) => {
  const wanted = (typeof which === 'string' ? which : which.text).trim().toLowerCase()
  const depth = typeof which === 'string' ? undefined : which.depth
  const matches = outlineMarkdown(source).headings.filter(
    (h) => h.text.toLowerCase() === wanted && (depth === undefined || h.depth === depth),
  )
  if (matches.length === 0) {
    return Effect.fail(
      new EditError({ reason: 'no-such-section', detail: `There is no section "${wanted}"` }),
    )
  }
  if (matches.length > 1) {
    return Effect.fail(
      new EditError({
        reason: 'ambiguous-section',
        detail: `"${wanted}" is the title of ${matches.length} sections; give its level to pick one`,
      }),
    )
  }
  return Effect.succeed(matches[0] as HeadingInfo)
}

export interface SectionEditOptions {
  /**
   * `true` stops at the next heading of any level, leaving subsections alone. By default a
   * section runs to the next heading of the same or a higher level and includes its subsections.
   */
  readonly excludeSubsections?: boolean
}

const sectionBounds = (source: string, heading: HeadingInfo, options: SectionEditOptions) => {
  const bodyStart = lineEndAfter(source, heading.position.end.offset ?? 0)
  let end = heading.sectionEnd
  if (options.excludeSubsections) {
    const next = outlineMarkdown(source).headings.find(
      (h) => (h.position.start.offset ?? 0) >= bodyStart,
    )
    if (next !== undefined) end = Math.min(end, next.position.start.offset ?? end)
  }
  return { bodyStart: Math.min(bodyStart, end), end }
}

/**
 * Replaces the body of a section, keeping its heading and the blank lines around the old text.
 * Everything outside the section is untouched.
 */
export const replaceSection = (
  source: string,
  which: SectionSelector,
  content: string,
  options: SectionEditOptions = {},
): Effect.Effect<string, EditError> =>
  Effect.map(findSection(source, which), (heading) => {
    const eol = detectEol(source)
    const { bodyStart, end } = sectionBounds(source, heading, options)
    const old = source.slice(bodyStart, end)
    const text = withEol(content.trim(), eol)
    const core = old.trim()

    let replacement: string
    if (core === '') {
      // An empty section: a blank line after the heading, the text, and a blank line before
      // whatever follows.
      const followed = end < source.length
      replacement = `${eol}${text}${eol}${followed ? eol : ''}`
    } else {
      const at = old.indexOf(core)
      replacement = old.slice(0, at) + text + old.slice(at + core.length)
    }
    return source.slice(0, bodyStart) + replacement + source.slice(end)
  })

/**
 * Adds text at the end of a section's own text (before its subsections, if it has any),
 * as a new paragraph.
 */
export const appendToSection = (
  source: string,
  which: SectionSelector,
  content: string,
): Effect.Effect<string, EditError> =>
  Effect.map(findSection(source, which), (heading) => {
    const eol = detectEol(source)
    const { bodyStart, end } = sectionBounds(source, heading, { excludeSubsections: true })
    const old = source.slice(bodyStart, end)
    const core = old.trim()
    const text = withEol(content.trim(), eol)
    if (core === '') {
      const followed = end < source.length
      return `${source.slice(0, bodyStart)}${eol}${text}${eol}${followed ? eol : ''}${source.slice(end)}`
    }
    const at = old.indexOf(core) + core.length
    return `${source.slice(0, bodyStart + at)}${eol}${eol}${text}${source.slice(bodyStart + at)}`
  })

/** Adds a new section at the end of the file. Fails if a section with that heading exists. */
export const appendSection = (
  source: string,
  heading: string,
  content: string,
  options: { readonly depth?: 1 | 2 | 3 | 4 | 5 | 6 } = {},
): Effect.Effect<string, EditError> => {
  const title = heading.trim()
  const exists = outlineMarkdown(source).headings.some(
    (h) => h.text.toLowerCase() === title.toLowerCase(),
  )
  if (exists) {
    return Effect.fail(
      new EditError({ reason: 'section-exists', detail: `There is already a section "${title}"` }),
    )
  }
  const eol = detectEol(source)
  const hashes = '#'.repeat(options.depth ?? 2)
  // Whatever the file ended with (no line ending, one, or several) it still ends with.
  const trailing = source === '' ? eol : (/(\r?\n)*$/.exec(source)?.[0] ?? '')
  const base = source.slice(0, source.length - trailing.length)
  const separator = base === '' ? '' : `${eol}${eol}`
  return Effect.succeed(
    `${base}${separator}${hashes} ${title}${eol}${eol}${withEol(content.trim(), eol)}${trailing}`,
  )
}
