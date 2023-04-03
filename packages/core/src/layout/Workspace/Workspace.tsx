import type { ReactElement } from 'react'

export const Workspace = ({ type }: { type: string }): ReactElement => {
  return (
    <h1>
      {type}
    </h1>
  )
}

