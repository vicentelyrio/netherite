import { Service } from 'typedi'

import {
  Resolver,
  Query,
  Arg,
  Mutation,
} from 'type-graphql'

import { Goal } from './Goal.type'
import { GoalService } from './Goal.service'

@Service()
@Resolver(() => Goal)
export class GoalResolver {
  constructor(private readonly service: GoalService) {}

  @Query(() => Goal, { description: 'Get a Goal' })
  async getGoalByName(@Arg('name') name: string): Promise<Goal> {
    return await this.service.getGoalByName(name)
  }

  @Query(() => [Goal], { description: 'Get all the Goals' })
  async getGoals(): Promise<Goal[]> {
    return await this.service.getGoals()
  }

  @Mutation(() => Goal)
  async addGoal(@Arg('data') data: string): Promise<Goal> {
    const file = await this.service.createGoal(data)
    return file as Goal
  }
}

