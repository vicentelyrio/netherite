import { Service } from 'typedi'

import {
  Resolver,
  Query,
  Arg,
} from 'type-graphql'

import { Goal } from './Goal.type'
import { GoalService } from './Goal.service'

@Service()
@Resolver(() => Goal)
export class GoalResolver {
  constructor(private readonly service: GoalService) {}

  async getGoalByName(@Arg('name') name: string): Promise<Goal | undefined> {
    return await this.service.getGoalByName(name)
  }

  @Query(() => [Goal], { description: 'Get all the Goals' })
  async getAllGoals(): Promise<Goal[]> {
    return await this.service.getAllGoals()
  }

  /* @Query(() => [File], { description: 'Get all the files containing a specific term' }) */
  /* async getFilesByTerms(@Arg('terms') terms: string[]): Promise<File[]> { */
  /*   return await this.service.getFilesByTerms(terms) */
  /* } */
}
