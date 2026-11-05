import type { Freshness } from './freshness'
import { lint } from './lint'
import type { Repo } from './ops/repo'
import { toScannedItem } from './scanned-item'
import { createIndex } from './workspace-index'

/**
 * Lints text that is not saved: what an editor holds while someone types. The text stands in for
 * the file at `path`, in a copy of the index, so links and duplicate IDs are judged against the
 * rest of the workspace. Only problems in that file are reported. The repo's own index is not
 * touched.
 */
export const lintText = (
  repo: Repo,
  path: string,
  text: string,
  options: { readonly freshness?: ReadonlyMap<string, Freshness> | undefined } = {},
) => {
  const index = createIndex({ config: repo.workspace.config })
  index.build([...repo.index.items().filter((i) => i.path !== path), toScannedItem(path, text)])
  return lint(index, {
    config: repo.workspace.config,
    contentRoot: repo.contentRoot,
    only: [path],
    ...(options.freshness ? { freshness: options.freshness } : {}),
  })
}
