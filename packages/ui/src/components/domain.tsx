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
  readonly box?: GlyphBox
  readonly hollow?: boolean
}

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
  readonly glyphOnly?: boolean
  readonly hollow?: boolean
}

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
  readonly category: StateCategory
}

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
  readonly commits?: number
  readonly atLeast?: boolean
  readonly since?: string | null
}

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
  readonly actions?: ReactNode
  readonly onClose?: () => void
}

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
  readonly actions?: ReactNode
}

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
