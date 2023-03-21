import { Field, ObjectType, ID } from 'type-graphql'

import { User } from 'resolvers/User/User.type'
import { Project } from 'resolvers/Project/Project.type'
import { Label } from 'resolvers/Label/Label.type'
import { State } from 'resolvers/State/State.type'
import type { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType({ description: 'Object representing a Task' })
export class Task {
  @Field({ description: 'The Task identifier' })
  identifier!: Identifier

  @Field({ description: 'The Task name' })
  name!: string

  @Field(() => ID, { description: 'The Task ID' })
  id!: string

  @Field({ description: 'The Task contents' })
  contents?: string

  @Field({ description: 'The Task slug' })
  slug?: string

  @Field(() => Label, { description: 'The Task label' })
  labels?: Label[]

  @Field(() => Project, { description: 'The Task Project' })
  project?: Project

  @Field(() => [User], { description: 'The Task owners' })
  owners?: User[]

  @Field(() => State, { description: 'The Task state' })
  state?: State
}

