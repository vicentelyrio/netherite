import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'Object representing a Subtask' })
export class Subtask {
  @Field({ description: 'The Subtask name' })
  name!: string

  @Field({ description: 'The Subtask conpletion state' })
  completed!: boolean
}

