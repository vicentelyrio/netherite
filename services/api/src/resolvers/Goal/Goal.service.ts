import matter from 'gray-matter'
import { Service, Inject } from 'typedi'

import { BaseFileService, type File } from 'services/BaseFile.service'
import { Identifier } from 'resolvers/Identifier/Identifier'

import { Goal } from './Goal.type'
import { validate, ValidationError } from 'class-validator'

@Service()
export class GoalService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService
  private readonly prefix = 'GO__'
  private readonly matcher = /^GO__/

  async getGoalByName(name: string) {
    const file = await this.service.getFileByName(`${this.prefix}${name}.md`)

    if (!file) throw new Error('Goal not found')

    return mapGoal(file)
  }

  async getGoals() {
    const goals = await this.service.getFilesByMatch(this.matcher)

    if (!goals.length) return []

    return goals.map(mapGoal)
  }

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

