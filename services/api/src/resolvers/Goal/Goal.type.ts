import { Field, ObjectType } from 'type-graphql'

import { Project } from 'resolvers/Project/Project.type'
import { GoalType } from 'resolvers/GoalType/GoalType.type'
import { User } from 'resolvers/User/User.type'

@ObjectType({ description: 'Object representing a Goal' })
export class Goal {
  @Field({ description: 'The Goal identifier' })
  identifier!: string

  @Field({ description: 'The Goal name' })
  name!: string

  @Field({ description: 'The Goal description' })
  description!: string

  @Field({ description: 'The Goal slug' })
  slug?: string

  @Field({ description: 'The Goal duration' })
  duration?: Date

  @Field(() => GoalType, { description: 'The Goal type' })
  type!: GoalType

  @Field(() => [Project], { description: 'The Goal projects' })
  projects?: Project[]

  @Field({ description: 'The Goal creation date' })
  createdAt?: Date

  @Field({ description: 'The Goal last edition date' })
  editedAt?: Date

  @Field(() => User, { description: 'The Goal author' })
  createdBy?: User

  @Field(() => User, { description: 'The Goal last editor' })
  editedBy?: User

  @Field({ description: 'The Goal raw markdown' })
  raw!: string
}

