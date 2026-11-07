import type { WatchOptions } from '@netherite/core'

export interface LiveOptions extends Pick<WatchOptions, 'backend' | 'debounceMs'> {
  readonly watch?: boolean
  readonly lintDebounceMs?: number
}
