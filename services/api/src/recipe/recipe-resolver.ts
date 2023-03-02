import {
  Resolver,
  Query,
  FieldResolver,
  Arg,
  Root,
  Mutation,
  Int,
} from 'type-graphql'

import type {  ResolverInterface } from 'type-graphql'

import { Recipe } from './recipe-type'
import { RecipeInput } from './recipe-input'

@Resolver(() => Recipe)
export class RecipeResolver implements ResolverInterface<Recipe> {
  private readonly items: Recipe[] = []

  @Query(() => Recipe, { nullable: true })
  async recipe(@Arg('title') title: string): Promise<Recipe | undefined> {
    return this.items.find(recipe => recipe.title === title)
  }

  @Query(() => [Recipe], { description: 'Get all the recipes from around the world' })
  async recipes(): Promise<Recipe[]> {
    return this.items
  }

  @Mutation(() => Recipe)
  async addRecipe(@Arg('recipe') recipeInput: RecipeInput): Promise<Recipe> {
    const recipe = Object.assign(new Recipe(), {
      description: recipeInput.description,
      title: recipeInput.title,
      ratings: [],
      creationDate: new Date(),
    })
    this.items.push(recipe as Recipe)
    return recipe as Recipe
  }

  @FieldResolver()
  ratingsCount(
    @Root() recipe: Recipe,
    @Arg('minRate', () => Int, { defaultValue: 0.0 }) minRate: number,
  ): number {
    return recipe?.ratings?.filter(rating => rating >= minRate).length ?? 0
  }
}
