import { Field, ObjectType } from 'type-graphql'

import type { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType({ description: 'Object representing a GoalType' })
export class GoalType {
  @Field({ description: 'The GoalType identifier' })
  identifier!: Identifier

  @Field({ description: 'The GoalType name' })
  name!: string

  @Field({ description: 'The GoalType description' })
  description!: string

  @Field({ description: 'The GoalType slug' })
  slug!: string
}

