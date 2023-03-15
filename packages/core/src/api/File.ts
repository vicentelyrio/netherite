import { gql } from '@apollo/client'

export const GET_FILES_BY_TERM = gql`
  query GetFilesByTerm($term: String!) {
    getFilesByTerm(term: $term) {
      name
      contents
    }
  }
`

export const GET_FILES = gql`
  query GetFiles {
    getFiles {
      contents
      name
    }
  }
`

