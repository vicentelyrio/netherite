import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * A path to use as `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM`, so a test never sees the machine's
 * own git settings. Nothing is created there: git treats a config file that is not there as empty,
 * and a path that does not exist is safe to use everywhere. `os.devNull` is not: it is `\\.\nul`
 * on Windows, which git cannot open. Creating a file at import time made every test process that
 * imported this package do file system work before its first test, and a failure there stops the
 * whole run before it starts.
 */
export const emptyGitConfig = join(tmpdir(), 'netherite-empty-gitconfig')
