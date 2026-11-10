import { useSyncExternalStore } from 'react'
import { dispatcher } from './dispatcher'

export const usePendingSequence = () =>
  useSyncExternalStore(dispatcher.subscribe, dispatcher.pending)
