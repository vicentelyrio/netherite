import { registerEnumType } from 'type-graphql'

export enum Identifier {
  goal = 'GOAL',
  goaltype = 'GOALTYPE',
  project = 'PROJECT',
  task = 'TASK',
  label = 'LABEL',
  user = 'USER',
  ui = 'UI',
}

registerEnumType(Identifier, {
  name: 'Identifier',
  description: 'The possible Identifiers',
})

