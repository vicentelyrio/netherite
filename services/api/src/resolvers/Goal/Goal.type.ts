import { Field, ObjectType } from 'type-graphql'
import { IsDate, IsString, MinLength } from 'class-validator'

import { BaseFile } from 'resolvers/BaseFile/BaseFile'
import { Project } from 'resolvers/Project/Project.type'

/**
* @memberof Goal Type
* @alias GoalType
*/
@ObjectType({ description: 'Object representing a GoalType' })
export class GoalType extends BaseFile {
  @Field({ description: 'The GoalType name' })
  name!: string

  @Field({ description: 'The GoalType slug' })
  slug!: string
}

/**
* @memberof Goal Type
* @alias Goal
*/
@ObjectType({ description: 'Object representing a Goal' })
export class Goal extends BaseFile {
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
}

/**
* @memberof Goal Type
* @alias GoalsByType
*/
@ObjectType({ description: 'Object representing Goals grouped by type' })
export class GoalsByType {
  @Field(() => [Goal], { description: 'List of Goals for the given type', nullable: true })
  goals?: Goal[]

  @Field({ description: 'The type of Goals in the list' })
  typeSlug!: string
}
