import { Constant, integer, list } from '../define'

export const history = {
  trackedFields: list(
    ['status', 'state', 'due', 'project', 'goals'],
    Constant,
    'Frontmatter fields whose changes count as transitions.',
  ),
  coChangeMaxCommits: integer(200, Constant, 'Commits read to find files that change together.', {
    unit: 'commits',
    min: 1,
  }),
  coChangeMaxFilesPerCommit: integer(
    40,
    Constant,
    'Commits touching more files than this are ignored as noise.',
    { unit: 'files', min: 1 },
  ),
  coChangeLimit: integer(10, Constant, 'Files listed as changing together.', {
    unit: 'files',
    min: 1,
  }),
} as const
