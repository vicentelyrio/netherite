type ClientProps = {
  url?: string
  path?: 'graphql'
  port?: number
}

declare module '@netherite/core' {
  ClientProps
}

