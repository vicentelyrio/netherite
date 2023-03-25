import { registerEnumType } from 'type-graphql'

export enum Identifier {
  goal = 'GOAL',
  project = 'PROJECT',
  task = 'TASK',
}

registerEnumType(Identifier, {
  name: 'Identifier',
  description: 'The possible Identifiers',
})

