import { Service } from 'typedi'

import {
  Resolver,
  Query,
  Arg,
  Mutation,
  FieldResolver,
  Root,
} from 'type-graphql'

import { Goal, GoalsByType, GoalType } from './Goal.type'
import { GoalService } from './Goal.service'

@Service()
@Resolver(() => Goal)
export class GoalResolver {
  constructor(private readonly service: GoalService) {}

  /**
  * @memberof Goal Resolver
  * @alias getGoalByName
  */
  @Query(() => Goal, { description: 'Get a Goal' })
  async goalByName(@Arg('name') name: string): Promise<Goal> {
    return await this.service.getGoalByName(name)
  }

  /**
  * @memberof Goal Resolver
  * @alias goals
  */
  @Query(() => [Goal], { description: 'Get all the Goals' })
  async goals(): Promise<Goal[]> {
    return await this.service.getGoals()
  }

  /**
  * @memberof Goal Resolver
  * @alias goalsByType
  */
  @Query(() => [GoalsByType], { description: 'Get all the Goals by Type' })
  async goalsByType(): Promise<GoalsByType[]> {
    const goals = await this.service.getGoals()

    const goalsByType =  goals.reduce((acc: Record<string, Goal[]>, cur) => {
      const { typeSlug } = cur

      if (!acc[typeSlug]) {
        acc[typeSlug] = []
      }

      (acc[typeSlug] as Goal[]).push(cur)

      return acc
    }, {})

    return await Promise.all(Object.keys(goalsByType).map(async (typeSlug: string): Promise<GoalsByType> => {
      const type = await this.service.getGoalTypeBySlug(typeSlug) as GoalType

      return {
        typeSlug,
        type,
        goals: goalsByType[typeSlug],
      }
    }))
  }

  /**
  * @memberof Goal Resolver
  * @alias createGoal
  */
  @Mutation(() => Goal)
  async createGoal(@Arg('data') data: string): Promise<Goal> {
    const file = await this.service.createGoal(data)
    return file as Goal
  }

  /**
  * @memberof Goal Resolver
  * @alias type
  */
  @FieldResolver()
  async type(@Root() goal: Goal) {
    return await this.service.getGoalTypeBySlug(goal.typeSlug)
  }

  /**
  * @memberof Goal Resolver
  * @alias projects
  */
  @FieldResolver()
  async projects(@Root() goal: Goal) {
    return await this.service.getGoalProjects(goal.slug as string)
  }
}

