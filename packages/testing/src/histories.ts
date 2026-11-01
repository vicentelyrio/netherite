import type { Commit } from './git-repo'

/**
 * Scripted history for `fixtures/basic`, on top of its initial commit (2026-01-01).
 * DOC-00001 and CTX-00001 cover `src/**` and were reviewed on 2026-01-10, so the three
 * commits after that date that touch `src/` make them drifting. RUN-00001 covers only
 * `src/util.ts` and was reviewed on 2026-01-15, after the last commit that touched that file
 * (2026-01-14), so it stays fresh.
 */
export const basicHistory: readonly Commit[] = [
  {
    message: 'feat: add greeting',
    date: '2026-01-08T10:00:00Z',
    write: { 'src/app.ts': 'export const app = () => "hello"\n' },
  },
  {
    message: 'feat: add farewell',
    date: '2026-01-11T10:00:00Z',
    author: { name: 'Grace Hopper', email: 'grace@example.com' },
    write: { 'src/app.ts': 'export const app = () => "hello and bye"\n' },
  },
  {
    message: 'refactor: split utilities',
    date: '2026-01-14T10:00:00Z',
    write: {
      'src/app.ts': 'import { util } from "./util"\nexport const app = () => util()\n',
      'src/util.ts': 'export const util = () => "hello and bye"\n',
    },
  },
  {
    message: 'fix: trim output',
    date: '2026-01-20T10:00:00Z',
    author: { name: 'Grace Hopper', email: 'grace@example.com' },
    write: {
      'src/app.ts': 'import { util } from "./util"\nexport const app = () => util().trim()\n',
    },
  },
]
