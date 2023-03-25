import { Field, ObjectType } from 'type-graphql'
import { Contains, IsDate, IsString, MinLength } from 'class-validator'

import { Project } from 'resolvers/Project/Project.type'
import { GoalType } from 'resolvers/GoalType/GoalType.type'
import { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType({ description: 'Object representing a Goal' })
export class Goal {
  @IsString()
  @Contains(Identifier.goal)
  @Field({ description: 'The Goal identifier' })
  identifier!: Identifier

  @IsString()
  @MinLength(2)
  @Field({ description: 'The Goal name' })
  name!: string

  @IsString()
  @Field({ description: 'The Goal description' })
  description!: string

  @IsString()
  @Field({ description: 'The Goal slug' })
  slug?: string

  @IsDate()
  @Field({ description: 'The Goal duration', nullable: true })
  duration?: Date

  @IsString()
  @Field({ description: 'The Goal type slug' })
  typeSlug!: string

  @Field(() => GoalType, { description: 'The Goal type', nullable: true })
  type?: GoalType

  @Field(() => [Project], { description: 'The Goal projects', nullable: true })
  projects?: Project[]

  @IsString()
  @Field({ description: 'The Goal raw markdown' })
  raw!: string
}

