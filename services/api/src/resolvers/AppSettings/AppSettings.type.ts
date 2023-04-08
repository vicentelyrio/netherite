import { Field, ObjectType } from 'type-graphql'

import { BaseFile } from 'resolvers/BaseFile/BaseFile'

/**
* @memberof AppSettings Type
* @alias Route
*/
@ObjectType({ description: 'Object representing a Route' })
export class Route {
  @Field({ description: 'The Route path' })
  path!: string

  @Field({ description: 'The Route template type', nullable: true })
  templateType?: string

  @Field({ description: 'The Route workspace type', nullable: true })
  workspaceType?: string

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
export class AppSettings extends BaseFile {
  @Field(() => [Route], { description: 'The AppSettings routes' })
  routes!: Route[]

  @Field(() => Navbar, { description: 'The AppSettings navbar' })
  navbar!: Navbar
}

