import { Service, Inject } from 'typedi'

import { BaseFileService, type File } from 'services/BaseFile.service'

import type { Goal } from './Goal.type'

@Service()
export class GoalService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService
  private readonly matcher = /^GO__/

  async getGoalByName(name: string) {
    const file = await this.service.getFileByName(name)

    if (!file) return

    return mapGoal(file)
  }

  async getAllGoals() {
    const goals = await this.service.getFilesByMatch(this.matcher)

    if (!goals.length) return []

    return goals.map(mapGoal)
  }
}

const mapGoal = (file: File) => {
  const { data, raw } = file
  return {
    ...data,
    raw,
  } as Goal
}
