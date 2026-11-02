export { applyFixes, type FixChange, type FixReport } from './fix'
export { contentHash } from './hash'
export { applyChanges, type Change } from './io'
export {
  type CreateInput,
  createItem,
  deleteItem,
  type FieldPatch,
  type ItemPatch,
  type LinkInput,
  link,
  markReviewed,
  type OpEnv,
  type OpError,
  type OpOptions,
  type OpResult,
  type RenameResult,
  readSource,
  renameTag,
  replaceSource,
  type SectionPatch,
  setState,
  supersede,
  type TagField,
  type TagUse,
  tagFields,
  tagUsage,
  toggleChecklistItem,
  unlink,
  updateFields,
  updateItem,
  updateSection,
} from './operations'
export { type Overlay, overlayFileSystem } from './overlay'
export { renameFile } from './rename'
export { type RenumberOptions, type RenumberResult, renumber } from './renumber'
export { makeRepo, openRepo, type Repo } from './repo'
