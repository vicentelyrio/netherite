import { CliFlag, Constant, integer, text } from '../define'

export const server = {
  host: text(
    '127.0.0.1',
    Constant,
    'Address the server listens on. Only loopback is accepted, because the server can write to your files.',
  ),
  port: integer(4747, CliFlag, 'First port to try.', { locator: '--port', min: 0, max: 65535 }),
  portFallbackSpan: integer(
    49,
    Constant,
    'How many ports after the first to try when it is taken.',
    { min: 0 },
  ),
  maxPort: integer(65535, Constant, 'Highest port number the fallback may reach.'),
  lintDebounceMs: integer(50, Constant, 'Wait after a change before linting again.', {
    unit: 'ms',
    min: 0,
  }),
} as const
