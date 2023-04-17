import matter from 'gray-matter'
import { Service, Inject } from 'typedi'

import { BaseFileService, type File } from 'services/BaseFile.service'
import { Identifier } from 'resolvers/Identifier/Identifier'

import { Goal, GoalType } from './Goal.type'
import { validate, ValidationError } from 'class-validator'

@Service()
export class GoalService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService
  private readonly prefix = 'GO__'
  private readonly matcher = /^GO__/
  private readonly matcherProjects = /^PR__/
  private readonly prefixType = 'GT__'

  /**
  * @memberof Goal Service
  * @alias getGoalByName
  */
  async getGoalByName(name: string) {
    const file = await this.service.getFileByName(`${this.prefix}${name}`)

    if (!file) throw new Error('Goal not found')

    return mapGoal(file)
  }

  /**
  * @memberof Goal Service
  * @alias getGoals
  */
  async getGoals() {
    const files = await this.service.getFilesByMatch(this.matcher)

    if (!files.length) return []

    return files.map(mapGoal)
  }

  /**
  * @memberof Goal Service
  * @alias getGoalTypeBySlug
  */
  async getGoalTypeBySlug(slug: string) {
    const file = await this.service.getFileByName(`${this.prefixType}${slug}`)

    if (!file) return null

    return mapGoalType(file)
  }

  /**
  * @memberof Goal Service
  * @alias getGoalTypeBySlug
  */
  async getGoalProjects(slug: string) {
    const files = await this.service.getFilesByMatchContent(this.matcherProjects, `goalSlug: ${slug}`)

    if (!files) return []

    return files.map(mapGoalProjects)
  }

  /**
  * @memberof Goal Service
  * @alias createGoal
  */
  async createGoal (raw: string): Promise<Goal | ValidationError[]> {
    const { data } = matter(raw)
    const goal = new Goal()

    Object.assign(goal, {
      raw,
      duration: new Date(data['duration']),
      name: data['name'],
      slug: this.service.slugify(data['name']),
      description: data['description'],
      identifier: Identifier.goal,
    })

    const errors = await validate(goal)

    if (errors?.length > 0) {
      throw errors[0]?.constraints
    }

    await this.service.createFile(raw, `${this.prefix}${goal?.slug}`)
    return goal as Goal
  }
}

const mapGoal = (file: File) => {
  const { data, raw } = file
  return { ...data, raw } as Goal
}

const mapGoalType = (file: File) => {
  const { data, raw } = file
  return { ...data, raw } as GoalType
}

const mapGoalProjects = (file: File) => {
  const { data, raw } = file
  return { ...data, raw } as GoalType
}

