import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const emptyGitConfig = join(tmpdir(), 'netherite-empty-gitconfig')
