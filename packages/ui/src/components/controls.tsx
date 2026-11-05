import {
  ActionIcon as MantineActionIcon,
  type ActionIconProps as MantineActionIconProps,
  Avatar as MantineAvatar,
  Button as MantineButton,
  type ButtonProps as MantineButtonProps,
  Card as MantineCard,
  type CardProps as MantineCardProps,
  Progress as MantineProgress,
  Select as MantineSelect,
  Tooltip,
} from '@mantine/core'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Icon } from '../icon'

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
  readonly icon?: string
}

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

export interface ActionIconProps
  extends Omit<MantineActionIconProps, 'children'>,
    Omit<ComponentPropsWithoutRef<'button'>, keyof MantineActionIconProps | 'aria-label'> {
  readonly icon: string
  readonly label: string
  readonly active?: boolean
  readonly tooltip?: boolean
}

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

const avatarColors = ['warning', 'lavender', 'success', 'adr', 'doc', 'context', 'runbook'] as const

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

export const avatarColorOf = (name: string) => {
  let hash = 0
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return avatarColors[hash % avatarColors.length] as (typeof avatarColors)[number]
}

export interface AvatarProps {
  readonly name: string
  readonly src?: string
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | number
  readonly color?: string
}

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

export interface CardProps extends MantineCardProps {
  readonly selected?: boolean
  readonly dropTarget?: boolean
  readonly interactive?: boolean
  readonly onClick?: () => void
  readonly children?: ReactNode
}

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

export const percentOf = (done: number, total: number) =>
  total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((done / total) * 100)))

const progressColor = () => 'success'

export interface ProgressProps {
  readonly done: number
  readonly total: number
  readonly label?: string
}

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
  readonly showCount?: boolean
}

export function ProgressRing({
  done,
  total,
  label = 'Progress',
  size = 44,
  showCount,
}: ProgressRingProps) {
  const percent = percentOf(done, total)
  const inset = Math.max(3, Math.round(size * 0.09))
  const text = Math.max(11, Math.round(size * 0.32))
  return (
    <div
      className="nt-ring"
      role="img"
      aria-label={`${label}: ${done} of ${total} done`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--nt-color-status-success) 0 ${percent}%, var(--nt-color-bg-track) 0)`,
      }}
    >
      <div className="nt-ring-inner" style={{ inset }} aria-hidden="true">
        {showCount ? (
          <span className="nt-ring-count" style={{ fontSize: Math.round(text * 0.7) }}>
            {done}/{total}
          </span>
        ) : (
          <span className="nt-ring-text">
            <span style={{ fontSize: text }}>{percent}</span>
            <span className="nt-ring-unit">%</span>
          </span>
        )}
      </div>
    </div>
  )
}

export interface SearchSelectProps {
  readonly label: string
  readonly placeholder: string
  readonly options: ReadonlyArray<string>
  readonly value: string | undefined
  readonly onChange: (value: string | undefined) => void
  readonly nothingFound: string
  readonly width?: number
}

export function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  nothingFound,
  width = 200,
}: SearchSelectProps) {
  return (
    <MantineSelect
      aria-label={label}
      placeholder={placeholder}
      data={[...options]}
      value={value ?? null}
      onChange={(next) => onChange(next ?? undefined)}
      searchable
      clearable
      nothingFoundMessage={nothingFound}
      comboboxProps={{ withinPortal: true, width: Math.max(width, 200) }}
      w={width}
      maxDropdownHeight={280}
      leftSection={<Icon name="search" size="inline" />}
    />
  )
}
