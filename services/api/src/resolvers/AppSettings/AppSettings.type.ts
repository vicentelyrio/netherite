import { Field, ObjectType, registerEnumType } from 'type-graphql'

import type { Identifier } from 'resolvers/Identifier/Identifier'

/**
* @memberof AppSettings Type
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
  description: 'The AppSettings Template'
})

/**
* @memberof AppSettings Type
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
* @memberof AppSettings Type
* @alias Navbar Link
*/
@ObjectType({ description: 'Object representing the Navbar Link' })
export class NavLink {
  @Field({ description: 'The icon name' })
  icon!: string

  @Field({ description: 'The path' })
  to!: string

  @Field({ description: 'The icon color', nullable: true })
  color?: string

  @Field({ description: 'The icon active color', nullable: true })
  colorActive?: string
}

/**
* @memberof AppSettings Type
* @alias Navbar
*/
@ObjectType({ description: 'Object representing the Navbar' })
export class Navbar {
  @Field(() => NavLink, { description: 'The Brand logo', nullable: true })
  brand!: NavLink

  @Field(() => NavLink, { description: 'The Search link' })
  search!: NavLink

  @Field(() => NavLink, { description: 'The Inbox link' })
  inbox!: NavLink

  @Field(() => [NavLink], { description: 'The primary navigation' })
  primaryOptions!: NavLink[]

  @Field(() => [NavLink], { description: 'The secondary navigation' })
  secondaryOptions!: NavLink[]
}

/**
* @memberof AppSettings Type
* @alias AppSettings
*/
@ObjectType({ description: 'Object representing a AppSettings' })
export class AppSettings {
  @Field({ description: 'The AppSettings identifier' })
  identifier!: Identifier

  @Field({ description: 'The AppSettings raw markdown' })
  raw!: string

  @Field(() => [Route], { description: 'The AppSettings routes' })
  routes!: Route[]

  @Field(() => Navbar, { description: 'The AppSettings navbar' })
  navbar!: Navbar
}

