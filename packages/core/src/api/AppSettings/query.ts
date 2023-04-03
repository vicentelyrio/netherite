import { gql } from '@apollo/client'

export const GET_APP_SETTINGS = gql`
  query GetAppSettings {
    getAppSettings {
      identifier
      raw
      routes {
        path
        templateType
        workspaceType
        children {
          templateType
          workspaceType
          path
        }
      }
      navbar {
        brand {
          icon
          to
          color
          colorActive
        }
        inbox {
          to
          icon
          color
          colorActive
        }
        search {
          to
          icon
          color
          colorActive
        }
        primaryOptions {
          to
          icon
          color
          colorActive
        }
        secondaryOptions {
          to
          icon
          color
          colorActive
        }
      }
    }
  }
`

