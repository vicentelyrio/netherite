import { Field, ObjectType, ID } from 'type-graphql'

import { Person } from 'resolvers/Person/Person.type'
import { Project } from 'resolvers/Project/Project.type'
import { Label } from 'resolvers/Label/Label.type'
import { State } from 'resolvers/State/State.type'

@ObjectType({ description: 'Object representing a Task' })
export class Task {
  @Field({ description: 'The Task name' })
  name!: string

  @Field(() => ID, { description: 'The Task ID' })
  id!: string

  @Field({ description: 'The Task contents' })
  contents!: string

  @Field({ description: 'The Task slug' })
  slug!: string

  @Field(() => Label, { description: 'The Task label' })
  labels!: Label[]

  @Field(() => Project, { description: 'The Task Project' })
  project!: Project

  @Field(() => [Person], { description: 'The Task owners' })
  owners!: Person[]

  @Field(() => State, { description: 'The Task state' })
  state!: State

  @Field({ description: 'The Task creation date' })
  createdAt!: Date

  @Field({ description: 'The Task last edition date' })
  editedAt!: Date

  @Field(() => Person, { description: 'The Task author' })
  createdBy!: Person

  @Field(() => Person, { description: 'The Task last editor' })
  editedBy!: Person
}

