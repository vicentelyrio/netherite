import { Field, ObjectType, registerEnumType } from 'type-graphql'

import type { Identifier } from 'resolvers/Identifier/Identifier'

/**
* @memberof Page Type
* @alias TemplateType
*/
enum TemplateType {
  GOALS = 'GOALS',
  GOAL = 'GOAL',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  TOPIC = 'TOPIC',
  GRAPH = 'GRAPH',
  SETTINGS = 'SETTINGS',
}

registerEnumType(TemplateType, {
  name: 'TemplateType',
  description: 'The Page Template'
})

/**
* @memberof Page Type
* @alias Route
*/
@ObjectType({ description: 'Object representing a Route' })
export class Route {
  @Field({ description: 'The Route path' })
  path!: string

  @Field({ description: 'The Route path', nullable: true })
  element?: string

  @Field(() => [Route], { description: 'The Route childrens', nullable: true })
  children?: Route[]
}

/**
* @memberof Page Type
* @alias Page
*/
@ObjectType({ description: 'Object representing a Page' })
export class Page {
  @Field({ description: 'The Page identifier' })
  identifier!: Identifier

  @Field({ description: 'The Page raw markdown' })
  raw!: string

  @Field(() => [Route], { description: 'The Page routes' })
  routes!: Route[]
}

