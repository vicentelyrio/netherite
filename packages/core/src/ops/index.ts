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
  readSource,
  replaceSource,
  type SectionPatch,
  setState,
  supersede,
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
