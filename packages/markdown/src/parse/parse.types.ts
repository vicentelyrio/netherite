import type { Root } from 'mdast'
import type { Position } from 'unist'

export interface FrontmatterError {
  readonly message: string
  readonly line: number
  readonly column: number
}

export interface Frontmatter {
  readonly raw: string
  readonly data: unknown
  readonly errors: ReadonlyArray<FrontmatterError>
  readonly fields: Readonly<Record<string, { readonly line: number; readonly column: number }>>
  readonly start: number
  readonly end: number
}

export interface HeadingInfo {
  readonly depth: 1 | 2 | 3 | 4 | 5 | 6
  readonly text: string
  readonly slug: string
  readonly position: Position
  readonly sectionEnd: number
}

export interface LinkInfo {
  readonly target: string
  readonly heading?: string
  readonly label?: string
  readonly raw: string
  readonly position: Position
}

export interface ChecklistItem {
  readonly checked: boolean
  readonly text: string
  readonly position: Position
  readonly toggleOffset: number
  readonly depth: number
  readonly section: string | undefined
}

export interface Outline {
  readonly source: string
  readonly frontmatter: Frontmatter | undefined
  readonly bodyStart: number
  readonly headings: ReadonlyArray<HeadingInfo>
  readonly links: ReadonlyArray<LinkInfo>
  readonly checklist: ReadonlyArray<ChecklistItem>
  readonly text: string
}

export interface ParsedMarkdown extends Outline {
  readonly tree: Root
}
