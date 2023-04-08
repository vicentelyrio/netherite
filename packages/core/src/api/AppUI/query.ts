import { gql, type TypedDocumentNode } from '@apollo/client'
import type { AppUI } from '@netherite/api'

export const GET_APP_UI_BY_TYPE: TypedDocumentNode<AppUI, string> = gql`
  query getAppUIByType($type: String!) {
    getAppUIByType(type: $type) {
      identifier
      raw
      type
    }
  }
`
