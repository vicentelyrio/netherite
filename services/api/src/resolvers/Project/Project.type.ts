import { Field, ObjectType } from 'type-graphql'

import { Goal } from 'resolvers/Goal/Goal.type'
import type { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType({ description: 'Object representing a Project' })
export class Project {
  @Field({ description: 'The Project identifier' })
  identifier!: Identifier

  @Field({ description: 'The Project name' })
  name!: string

  @Field({ description: 'The Project description' })
  description!: string

  @Field({ description: 'The Project slug' })
  slug?: string

  @Field(() => [Goal], { description: 'The Project goals' })
  goals?: Goal[]
}
