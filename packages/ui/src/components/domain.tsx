import {
  type AdrStatus,
  badgeGlyph,
  color,
  type FreshnessState,
  type GlyphBox,
  type ItemTypeName,
  type StateCategory,
} from '@netherite/tokens'
import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../icon'

export const typeLabels: Readonly<Record<ItemTypeName, string>> = {
  goal: 'Goal',
  project: 'Project',
  task: 'Task',
  adr: 'ADR',
  doc: 'Doc',
  context: 'Context',
  runbook: 'Runbook',
}

/** A glyph box as inline style: the shape is drawn by a rotated, rounded, filled or ringed box. */
export const glyphStyle = (box: GlyphBox): CSSProperties => ({
  width: box.width,
  height: box.height,
  borderRadius: box.radius,
  transform: box.rotate === 0 ? undefined : `rotate(${box.rotate}deg)`,
  background: box.fill,
  border: box.border,
})

export interface TypeGlyphProps {
  readonly type: ItemTypeName
  /** A box to draw in instead of the badge's: for example the graph's node glyph. */
  readonly box?: GlyphBox
  /** A superseded ADR is a hollow diamond. */
  readonly hollow?: boolean
}

/** The shape of an item type, in its colour, as the badges and the graph draw it. */
export function TypeGlyph({ type, box, hollow }: TypeGlyphProps) {
  const base = box ?? badgeGlyph[type]
  const look: GlyphBox =
    hollow && type === 'adr'
      ? { ...base, fill: 'transparent', border: `1.5px solid ${color.type.adr}` }
      : base
  return (
    <span className="nt-type-glyph" data-type={type} aria-hidden="true" style={glyphStyle(look)} />
  )
}

export interface TypeBadgeProps {
  readonly type: ItemTypeName
  /** Show only the shape. The name stays available to screen readers. */
  readonly glyphOnly?: boolean
  readonly hollow?: boolean
}

/**
 * Says what kind of item something is. The badge keeps a neutral ground and the type shows in the
 * glyph and the label colour, not a filled block (sheet T2).
 */
export function TypeBadge({ type, glyphOnly, hollow }: TypeBadgeProps) {
  return (
    <span
      className="nt-type-badge"
      data-type={type}
      style={{ ['--nt-badge-color' as string]: `var(--nt-color-type-${type})` }}
    >
      <TypeGlyph type={type} {...(hollow === undefined ? {} : { hollow })} />
      <span className={glyphOnly ? 'nt-visually-hidden' : undefined}>{typeLabels[type]}</span>
    </span>
  )
}

const adrIcons: Record<AdrStatus, string> = {
  proposed: 'pending',
  accepted: 'check_circle',
  deprecated: 'block',
  superseded: 'swap_horiz',
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export interface AdrStatusPillProps {
  readonly status: AdrStatus
}

/** An ADR's status: proposed, accepted, deprecated or superseded, as a coloured pill with an icon. */
export function AdrStatusPill({ status }: AdrStatusPillProps) {
  return (
    <span
      className="nt-status-pill"
      data-value={status}
      style={{ ['--nt-pill-color' as string]: `var(--nt-color-adr-${status})` }}
    >
      <Icon name={adrIcons[status]} size="pill" />
      {capitalize(status)}
    </span>
  )
}

const stateIcons: Record<StateCategory, string> = {
  todo: 'radio_button_unchecked',
  active: 'play_circle',
  blocked: 'pause',
  done: 'check_circle',
}

export interface TaskStatePillProps {
  readonly state: string
  /** The state's category in the config; decides the colour and the icon. */
  readonly category: StateCategory
}

/** A task's state as a pill, like the ADR status: its colour at 14% behind an icon and the name. */
export function TaskStatePill({ state, category }: TaskStatePillProps) {
  return (
    <span
      className="nt-status-pill"
      data-kind="state"
      data-value={category}
      style={{ ['--nt-pill-color' as string]: `var(--nt-color-state-${category})` }}
    >
      <Icon name={stateIcons[category]} size="pill" />
      {capitalize(state)}
    </span>
  )
}

export type StatusPillProps =
  | ({ readonly kind: 'adr' } & AdrStatusPillProps)
  | ({ readonly kind: 'state' } & TaskStatePillProps)

/** An ADR status or a task state, whichever is given. */
export function StatusPill(props: StatusPillProps) {
  return props.kind === 'adr' ? (
    <AdrStatusPill status={props.status} />
  ) : (
    <TaskStatePill state={props.state} category={props.category} />
  )
}

const freshnessText: Record<FreshnessState, string> = {
  fresh: 'Fresh',
  drifting: 'Drifting',
  stale: 'Stale',
  unknown: 'Not tracked',
}

const plural = (n: number, atLeast: boolean) =>
  `${n}${atLeast ? '+' : ''} ${n === 1 && !atLeast ? 'commit' : 'commits'}`

export interface FreshnessLabelProps {
  readonly state: FreshnessState
  /** Commits to covered files since the last review. */
  readonly commits?: number
  /** The count is a minimum: history is cut short (a shallow clone). */
  readonly atLeast?: boolean
  /** When it was last reviewed or changed, for the tooltip. */
  readonly since?: string | null
}

/**
 * Whether a doc still matches the code it covers (sheet T2): a green dot when fresh, an amber ring
 * when drifting (1 to 9 commits), a filled warning icon and heavier text when stale (10 or more).
 */
export function FreshnessLabel({ state, commits, atLeast = false, since }: FreshnessLabelProps) {
  const count =
    (state === 'drifting' || state === 'stale') && commits !== undefined
      ? ` · ${plural(commits, atLeast)}`
      : ''
  const title =
    commits !== undefined && since
      ? `${plural(commits, atLeast)} to covered files since ${since}`
      : undefined
  return (
    <span className="nt-freshness" data-state={state} title={title}>
      <span className="nt-freshness-mark" aria-hidden="true">
        {state === 'stale' ? (
          <Icon name="warning" size="inline" filled style={{ color: color.freshness.stale }} />
        ) : state === 'unknown' ? null : (
          <span className="nt-freshness-dot" />
        )}
      </span>
      <span>
        {freshnessText[state]}
        {count}
      </span>
    </span>
  )
}

/** Knowledge that nothing links to. */
export function OrphanTag() {
  return (
    <span className="nt-orphan">
      <Icon name="link_off" size={13} />
      orphan
    </span>
  )
}

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger'

const bannerIcon: Record<BannerVariant, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
}

export interface BannerProps {
  readonly variant?: BannerVariant
  readonly title?: string
  readonly children?: ReactNode
  /** Buttons for what to do about it. */
  readonly actions?: ReactNode
  /** Shows a close button that calls this. */
  readonly onClose?: () => void
}

/**
 * A message across the top of a view: a stale doc, a superseded ADR, a file that changed on disk.
 * The warning is sheet T2's `warning-bg`: a 10% amber ground, a 35% amber edge, radius 10.
 */
export function Banner({ variant = 'info', title, children, actions, onClose }: BannerProps) {
  return (
    <div
      className="nt-banner"
      data-variant={variant}
      role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
    >
      <Icon
        name={bannerIcon[variant]}
        size={20}
        filled={variant === 'warning'}
        className="nt-banner-icon"
      />
      <div className="nt-banner-body">
        {title !== undefined && <div className="nt-banner-title">{title}</div>}
        {children !== undefined && <div className="nt-banner-text">{children}</div>}
      </div>
      {actions !== undefined && <div className="nt-banner-actions">{actions}</div>}
      {onClose !== undefined && (
        <button type="button" className="nt-banner-close" aria-label="Dismiss" onClick={onClose}>
          <Icon name="close" size="inline" />
        </button>
      )}
    </div>
  )
}

export interface EmptyStateProps {
  readonly icon?: string
  readonly title: string
  readonly description?: ReactNode
  /** Starting points: buttons or links. */
  readonly actions?: ReactNode
}

/** What a view shows when there is nothing in it yet, and what to do about that. */
export function EmptyState({ icon = 'inbox', title, description, actions }: EmptyStateProps) {
  return (
    <div className="nt-empty">
      <Icon name={icon} size={24} weight={300} className="nt-empty-icon" />
      <h3 className="nt-empty-title">{title}</h3>
      {description !== undefined && <p className="nt-empty-text">{description}</p>}
      {actions !== undefined && <div className="nt-empty-actions">{actions}</div>}
    </div>
  )
}
