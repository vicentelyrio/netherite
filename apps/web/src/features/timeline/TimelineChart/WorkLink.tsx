import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import type { Row } from '../layout'

export type WorkRow = Exclude<Row, { readonly kind: 'decision' }>

export function WorkLink({
  row,
  ...rest
}: { readonly row: WorkRow } & Omit<ComponentProps<'a'>, 'href'>) {
  if (row.kind === 'goal')
    return <Link to="/goals/$id" params={{ id: row.item.id }} {...(rest as object)} />
  if (row.kind === 'project')
    return <Link to="/projects/$id" params={{ id: row.item.id }} {...(rest as object)} />
  return (
    <Link
      to="/projects/$id"
      params={{ id: row.item.project ?? '' }}
      search={{ task: row.item.id }}
      {...(rest as object)}
    />
  )
}
