import { useQuery } from '@apollo/client'

import { Avatar } from '@netherite/ds-components'

import { GET_FILES_BY_TERM } from 'api/File'
import { usePage } from 'hooks/usePage'
import { useEffect } from 'react'

export const App = () => {
  const { data } = useQuery(GET_FILES_BY_TERM, {
    variables: { term: "layout" }
  })

  const { getPage } = usePage()

  useEffect(() => {
    const { contents = null } = data?.getFilesByTerm ? (data?.getFilesByTerm[0] || {}) : {}

    if (!contents) return

    getPage(contents)
  }, [data])

  return (
    <div className="App">
      <Avatar label="Olar" />
    </div>
  )
}

