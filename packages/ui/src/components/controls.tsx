import {
  ActionIcon as MantineActionIcon,
  type ActionIconProps as MantineActionIconProps,
  Avatar as MantineAvatar,
  Button as MantineButton,
  type ButtonProps as MantineButtonProps,
  Card as MantineCard,
  type CardProps as MantineCardProps,
  Progress as MantineProgress,
  RingProgress as MantineRingProgress,
  Tooltip,
} from '@mantine/core'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Icon } from '../icon'

// ---- Button ------------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'

const buttonLook: Record<ButtonVariant, Pick<MantineButtonProps, 'variant' | 'color'>> = {
  primary: { variant: 'filled', color: 'lavender' },
  secondary: { variant: 'default' },
  subtle: { variant: 'subtle', color: 'gray' },
  danger: { variant: 'filled', color: 'danger' },
}

export interface ButtonProps
  extends Omit<MantineButtonProps, 'variant' | 'color' | 'leftSection' | 'rightSection'>,
    Omit<ComponentPropsWithoutRef<'button'>, keyof MantineButtonProps> {
  readonly variant?: ButtonVariant
  /** A Material Symbols name shown before the label. */
  readonly icon?: string
}

/** A button. `primary` is the one main action of a view; `danger` is for deleting. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', icon, children, ...rest },
  ref,
) {
  return (
    <MantineButton
      ref={ref}
      {...buttonLook[variant]}
      {...(icon === undefined ? {} : { leftSection: <Icon name={icon} size="inline" /> })}
      {...rest}
    >
      {children}
    </MantineButton>
  )
})

// ---- ActionIcon ----------------------------------------------------------------------------

export interface ActionIconProps
  extends Omit<MantineActionIconProps, 'children'>,
    Omit<ComponentPropsWithoutRef<'button'>, keyof MantineActionIconProps | 'aria-label'> {
  /** The Material Symbols name. */
  readonly icon: string
  /** What the button does. Required: an icon alone says nothing to a screen reader. Also its tooltip. */
  readonly label: string
  /** The button is on, like a toggle. */
  readonly active?: boolean
  readonly tooltip?: boolean
}

/** An icon-only button with an accessible name and a tooltip. */
export const ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(function ActionIcon(
  { icon, label, active, tooltip = true, ...rest },
  ref,
) {
  const button = (
    <MantineActionIcon
      ref={ref}
      aria-label={label}
      {...(active === undefined
        ? {}
        : { 'aria-pressed': active, 'data-active': active || undefined })}
      {...rest}
    >
      <Icon name={icon} size="switcher" weight={300} />
    </MantineActionIcon>
  )
  return tooltip ? <Tooltip label={label}>{button}</Tooltip> : button
})

// ---- Avatar ---------------------------------------------------------------------------------

/** The design's own avatar is amber; others take the next colours of the palette. */
const avatarColors = ['warning', 'lavender', 'success', 'adr', 'doc', 'context', 'runbook'] as const

/** One to two letters from a name or `@handle`. */
export const initialsOf = (name: string) => {
  const words = name
    .replace(/^@/, '')
    .split(/[\s._-]+/)
    .filter((w) => w !== '')
  const letters =
    words.length > 1
      ? `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`
      : (words[0] ?? '').slice(0, 2)
  return letters.toUpperCase()
}

/** The same person always gets the same colour. */
export const avatarColorOf = (name: string) => {
  let hash = 0
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return avatarColors[hash % avatarColors.length] as (typeof avatarColors)[number]
}

export interface AvatarProps {
  /** A name or `@handle`. */
  readonly name: string
  readonly src?: string
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | number
  /** A colour of the theme. Default: one picked from the name, so a person keeps theirs. */
  readonly color?: string
}

/** A person: their picture if there is one, otherwise their initials on a colour of their own. */
export function Avatar({ name, src, size = 'sm', color }: AvatarProps) {
  return (
    <MantineAvatar
      {...(src === undefined ? {} : { src })}
      alt={name}
      size={size}
      variant="filled"
      color={color ?? avatarColorOf(name)}
      name={name}
    >
      {initialsOf(name)}
    </MantineAvatar>
  )
}

// ---- Card ----------------------------------------------------------------------------------

export interface CardProps extends MantineCardProps {
  /** The card is the current choice (a selected row or the open item). */
  readonly selected?: boolean
  /** Something being dragged would land here. */
  readonly dropTarget?: boolean
  /** The card can be clicked: it gets hover feedback and can be reached with the keyboard. */
  readonly interactive?: boolean
  readonly onClick?: () => void
  readonly children?: ReactNode
}

/** A card with the states the board needs: hover, selected, and drop target. */
export function Card({ selected, dropTarget, interactive, onClick, children, ...rest }: CardProps) {
  const clickable = interactive === true || onClick !== undefined
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onClick !== undefined && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }
  return (
    <MantineCard
      {...rest}
      data-interactive={clickable || undefined}
      data-selected={selected || undefined}
      data-drop-target={dropTarget || undefined}
      {...(clickable ? { tabIndex: 0, role: onClick ? 'button' : 'group', onKeyDown } : {})}
      {...(selected === undefined
        ? {}
        : {
            'aria-pressed': onClick ? selected : undefined,
            'aria-current': selected ? 'true' : undefined,
          })}
      onClick={onClick}
    >
      {children}
    </MantineCard>
  )
}

// ---- Progress ------------------------------------------------------------------------------

/** Share done, 0 to 100. Nothing to do counts as nothing done. */
export const percentOf = (done: number, total: number) =>
  total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((done / total) * 100)))

/** Progress is green in the design, finished or not. */
const progressColor = () => 'success'

export interface ProgressProps {
  readonly done: number
  readonly total: number
  /** Describes what is measured, for screen readers. */
  readonly label?: string
}

/** A bar: how much of the checklist, the project or the goal is done. */
export function Progress({ done, total, label = 'Progress' }: ProgressProps) {
  const percent = percentOf(done, total)
  return (
    <MantineProgress
      value={percent}
      size={6}
      color={progressColor()}
      aria-label={`${label}: ${done} of ${total} done`}
    />
  )
}

export interface ProgressRingProps extends ProgressProps {
  readonly size?: number
  /** Show the count (`3/5`) in the middle instead of the percentage. */
  readonly showCount?: boolean
}

/** A ring, for goals and projects overviews. */
export function ProgressRing({
  done,
  total,
  label = 'Progress',
  size = 44,
  showCount,
}: ProgressRingProps) {
  const percent = percentOf(done, total)
  return (
    <MantineRingProgress
      size={size}
      sections={[{ value: percent, color: progressColor() }]}
      label={
        <span className="nt-ring-text" aria-hidden="true">
          {showCount ? `${done}/${total}` : `${percent}%`}
        </span>
      }
      role="img"
      aria-label={`${label}: ${done} of ${total} done`}
    />
  )
}
