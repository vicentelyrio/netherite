import { gql } from '@apollo/client'

export const GET_APP_SETTINGS = gql`
  query GetAppSettings {
    getAppSettings {
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
      navbar {
        brand {
          icon
          to
        }
        inbox {
          to
          icon
        }
        search {
          to
          icon
        }
        primaryOptions {
          to
          icon
        }
        secondaryOptions {
          to
          icon
        }
      }
    }
  }
`

