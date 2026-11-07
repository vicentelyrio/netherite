import { CliFlag, Constant, integer, text } from '../define'

export const migration = {
  surveyMaxBytes: integer(1024 * 1024, Constant, 'Largest file a repository survey reads.', {
    unit: 'bytes',
    min: 1,
  }),
  surveyExamples: integer(4, Constant, 'Example paths shown per group in a survey.', {
    unit: 'items',
    min: 0,
  }),
  scanOutput: text(
    '.netherite/local/scan.json',
    CliFlag,
    'Where `netherite scan` writes its report.',
    { locator: '--out' },
  ),
} as const
