import {
  appendSection as appendSectionEdit,
  appendToSection as appendToSectionEdit,
  replaceSection as replaceSectionEdit,
} from '../../edit'
import type { Repo } from '../repo'
import { mutate } from './mutate'
import type { Op, OpOptions } from './operations.types'

export interface SectionPatch {
  readonly heading: string
  readonly content: string
  readonly mode?: 'replace' | 'append' | 'create'
  readonly depth?: 1 | 2 | 3 | 4 | 5 | 6
}

export const updateSection = (
  repo: Repo,
  id: string,
  patch: SectionPatch,
  options: OpOptions = {},
): Op =>
  mutate(repo, [
    {
      id,
      baseHash: options.baseHash,
      edit: (source) =>
        patch.mode === 'create'
          ? appendSectionEdit(
              source,
              patch.heading,
              patch.content,
              patch.depth ? { depth: patch.depth } : {},
            )
          : patch.mode === 'append'
            ? appendToSectionEdit(source, patch.heading, patch.content)
            : replaceSectionEdit(source, patch.heading, patch.content),
    },
  ])
