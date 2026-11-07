export { checkTargetOf, toggleChecklistItem } from './checklist'
export { type CreateInput, createItem } from './createItem'
export { deleteItem } from './deleteItem'
export { type LinkInput, link, unlink } from './links'
export { markReviewed } from './markReviewed'
export type { OpEnv, OpError, OpOptions, OpResult } from './operations.types'
export { setState, supersede } from './setState'
export { readSource, replaceSource } from './source'
export {
  type RenameResult,
  renameArea,
  renameTag,
  type TagField,
  type TagUse,
  tagFields,
  tagUsage,
} from './tags'
export { type FieldPatch, type ItemPatch, updateFields, updateItem } from './updateItem'
export { type SectionPatch, updateSection } from './updateSection'
