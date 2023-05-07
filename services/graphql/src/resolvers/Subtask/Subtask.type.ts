import { Field, ObjectType } from 'type-graphql'

import type { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType({ description: 'Object representing a Subtask' })
export class Subtask {
  @Field({ description: 'The Subtask identifier' })
  identifier!: Identifier

  @Field({ description: 'The Subtask name' })
  name!: string

  @Field({ description: 'The Subtask conpletion state' })
  completed = false
}

