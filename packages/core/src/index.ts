export { handleFrom } from '@netherite/git'
export {
  type FieldIssue,
  type ItemType,
  itemJsonSchemas,
  itemTypes,
  ValidationError,
} from '@netherite/schema'
export {
  type ActivityEntry,
  type ActivityLog,
  activityFile,
  appendActivity,
  groupActivity,
  type ItemActivity,
  type NewActivity,
  type ReadActivityOptions,
  readActivity,
} from './activity'
export { type AsOfGraph, type AsOfNode, type AsOfOptions, graphAsOf } from './asof'
export {
  type CoChange,
  type CoChanged,
  type CoChangeOptions,
  type CoverSuggestion,
  coChanged,
  type SuggestOptions,
  suggestCovers,
} from './cochange'
export {
  buildContext,
  type ContextBundle,
  type ContextItem,
  type ContextOptions,
  type ContextTarget,
  estimateTokens,
} from './context-bundle'
export {
  applyBlock,
  endMarker,
  renderBlock,
  type SyncOptions,
  type SyncReport,
  type SyncStatus,
  type SyncTarget,
  startMarker,
  syncContext,
  type TargetReport,
  targetFiles,
} from './context-sync'
export * from './edit'
export {
  AlreadyExists,
  AmbiguousId,
  BadMarkers,
  ConfigInvalid,
  type ConfigIssue,
  ConfigReadError,
  ConflictError,
  EditError,
  type EditFailure,
  formatConfigIssue,
  IoError,
  ItemReadError,
  NotFound,
  StillLinked,
  WorkspaceNotFound,
} from './errors'
export { fileSlug, itemFileName, itemRelativePath, typeFolders } from './filenames'
export {
  compileCovers,
  computeFreshness,
  type Freshness,
  type FreshnessInput,
  type FreshnessState,
  stateFor,
  type Thresholds,
} from './freshness'
export { type FreshnessCache, freshnessCache } from './freshness-cache'
export {
  type GitError,
  type GitRepository,
  type GitStatus,
  gitHandle,
  type StatusEntry,
  workspaceGit,
} from './git-access'
export { type PathMap, pathMap } from './gitpaths'
export {
  type AdrWeek,
  type Author,
  type AuthorSummary,
  adrActivityByWeek,
  authorsOf,
  commitsByWeek,
  completionsByWeek,
  decisionLog,
  defaultTrackedFields,
  type FieldValue,
  type History,
  type HistoryOptions,
  type ItemHistory,
  type ProgressPoint,
  type ProgressSeries,
  progressSeries,
  readHistory,
  type Transition,
  taskTransitions,
  type WeekCount,
  type WeekRange,
  weekStart,
} from './history'
export { type Horizon, parseHorizon } from './horizon'
export { nextId, nextIds } from './ids'
export {
  type Lifecycle,
  type LifecycleEvent,
  type LifecycleKind,
  type LifecycleOptions,
  lifecycles,
  type Phase,
  type Span,
} from './lifecycle'
export {
  type Diagnostic,
  type Fix,
  type LintOptions,
  type LintSummary,
  lint,
  lintWorkspace,
  type RuleId,
  type Severity,
  summarize,
} from './lint'
export { lintText } from './lint-text'
export { applyMarkedBlock, type Markers, renderMarkedBlock } from './marked-block'
export * from './ops'
export { type ParseOptions, parseFiles, type SourceFile } from './parse-pool'
export {
  type Delta,
  type Period,
  type PeriodOptions,
  type PeriodStats,
  periodStats,
} from './period-stats'
export {
  createResolver,
  lookupKeys,
  type MutableResolver,
  makeResolver,
  type Resolution,
  type ResolvedVia,
  type Resolver,
} from './resolve'
export { scanItems } from './scan'
export { type ScannedItem, scannedItemFrom, toScannedItem } from './scanned-item'
export {
  type Timeline,
  type TimelineDecision,
  type TimelineGoal,
  type TimelineHold,
  type TimelineOptions,
  type TimelineProject,
  type TimelineTask,
  timelineOf,
} from './timeline'
export {
  type BoardCard,
  type BoardColumn,
  type BoardItem,
  boardOf,
  type ChainLink,
  fieldsOf,
  type GoalRow,
  goalDetail,
  goalRows,
  graphOf,
  type ItemFilter,
  type ItemSearchOptions,
  type ItemSummary,
  itemDetail,
  itemSummary,
  type KnowledgeRow,
  knowledgeRows,
  type LinkView,
  type ListOptions,
  listItems,
  matchesFilter,
  type ProjectRow,
  projectRows,
  searchItems,
  snippetOf,
  summaryOf,
  supersessionChain,
} from './views'
export {
  type ChangeEvent,
  parcelBackend,
  type RawEvent,
  type WatchBackend,
  WatchError,
  type Watcher,
  type WatchOptions,
  watchRepo,
} from './watch'
export {
  configFile,
  findWorkspaceRoot,
  loadWorkspace,
  openWorkspace,
  parseConfig,
  type Workspace,
} from './workspace'
export {
  createIndex,
  type Edge,
  type EdgeKind,
  extractRefs,
  type IndexChange,
  type IndexOptions,
  type Progress,
  type Ref,
  type ResolvedRef,
  type SearchHit,
  type SearchOptions,
  type WorkspaceIndex,
} from './workspace-index'
