import type { WatchBackend } from './watch.types'

export const parcelBackend: WatchBackend = {
  subscribe: async (dir, onEvents, options) => {
    const module = await import('@parcel/watcher')
    const parcel = (module.default ?? module) as typeof import('@parcel/watcher')
    return parcel.subscribe(
      dir,
      (error, events) => {
        if (error === null) onEvents(events.map((event) => ({ path: event.path })))
      },
      { ignore: [...options.ignore] },
    )
  },
}
