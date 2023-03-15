import { Field, ObjectType } from 'type-graphql'

import { Goal } from 'resolvers/Goal/Goal.type'
import { Person } from 'resolvers/Person/Person.type'

@ObjectType({ description: 'Object representing a Project' })
export class Project {
  @Field({ description: 'The Project name' })
  name!: string

  @Field({ description: 'The Project description' })
  description!: string

  @Field({ description: 'The Project slug' })
  slug!: string

  @Field(() => [Goal], { description: 'The Project goals' })
  goals!: Goal[]

  @Field({ description: 'The Project creation date' })
  createdAt!: Date

  @Field({ description: 'The Project last edition date' })
  editedAt!: Date

  @Field(() => Person, { description: 'The Project author' })
  createdBy!: Person

  @Field(() => Person, { description: 'The Project last editor' })
  editedBy!: Person
}
