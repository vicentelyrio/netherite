import { gql } from '@apollo/client'

export const GET_PAGE_BY_NAME = gql`
  query GetPageByName($name: String!) {
    getPageByName(name: $name) {
      identifier
      raw
      routes {
        element
        path
        children {
          element
          path
        }
      }
    }
  }
`

