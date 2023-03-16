import { Field, ObjectType } from 'type-graphql'

import { Goal } from 'resolvers/Goal/Goal.type'
import { User } from 'resolvers/User/User.type'

@ObjectType({ description: 'Object representing a Project' })
export class Project {
  @Field({ description: 'The Project name' })
  name!: string

  @Field({ description: 'The Project description' })
  description!: string

  @Field({ description: 'The Project slug' })
  slug?: string

  @Field(() => [Goal], { description: 'The Project goals' })
  goals?: Goal[]

  @Field({ description: 'The Project creation date' })
  createdAt?: Date

  @Field({ description: 'The Project last edition date' })
  editedAt?: Date

  @Field(() => User, { description: 'The Project author' })
  createdBy?: User

  @Field(() => User, { description: 'The Project last editor' })
  editedBy?: User
}
