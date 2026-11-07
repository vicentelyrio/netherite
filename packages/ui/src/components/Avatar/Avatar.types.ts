export interface AvatarProps {
  readonly name: string
  readonly src?: string
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | number
  readonly color?: string
}
