import { SequenceHint } from '../SequenceHint'
import { ShortcutSheet } from '../ShortcutSheet'
import { useSectionKeys } from './useSectionKeys'

export function KeyboardLayer() {
  useSectionKeys()
  return (
    <>
      <SequenceHint />
      <ShortcutSheet />
    </>
  )
}
