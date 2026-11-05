import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * An empty git config file, for `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM`, so a test never sees
 * the machine's own settings. It is a real file because `os.devNull` is `\\.\nul` on Windows,
 * which git cannot open.
 */
export const emptyGitConfig = (() => {
  const file = join(tmpdir(), 'netherite-empty-gitconfig')
  // Appending nothing creates it if missing and is safe when test workers start together.
  writeFileSync(file, '', { flag: 'a' })
  return file
})()
