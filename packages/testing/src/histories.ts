import type { Commit } from './git-repo'

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
