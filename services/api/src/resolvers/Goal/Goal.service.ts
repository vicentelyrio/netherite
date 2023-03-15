import { Service, Inject } from 'typedi'
import matter from 'gray-matter'

import { BaseFileService } from 'services/BaseFile.service'

import type { Goal } from './Goal.type'
import type { GoalType } from 'resolvers/GoalType/GoalType.type'
import type { Person } from 'resolvers/Person/Person.type'
import type { File } from 'resolvers/file/file.type'

@Service()
export class GoalService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService

  private readonly goalPageDelimiters = [
    'identifier: GOAL',
  ]

  async getGoalByName(name: string) {
    const file = await this.service.getFileByName(name)

    if (!file) return

    return mapGoal(file)
  }

  async getAllGoals() {
    const goals = await this.service.getFilesByTerms(this.goalPageDelimiters)
    console.log(goals)

    if (!goals.length) return []

    return goals.map(mapGoal)
  }
}

const mapGoal = (file: File) => {
  const { data } = matter(file?.contents as string)

  console.log(data)

  return {
    name: data['name'] ?? '',
    description: data['description'] ?? '',
    slug: '',
    duration: new Date(),
    type: {
      name: file?.name,
      description: 'aa',
      slug: '',
      createdAt: new Date(),
      createdBy: {
        name: '',
        email: '',
        slug: '',
        initials: '',
        color: ''
      } as Person,
      editedAt: new Date(),
      editedBy: {
        name: '',
        email: '',
        slug: '',
        initials: '',
        color: ''
      } as Person,
    } as GoalType,
    projects: [],
    createdAt: new Date(),
    createdBy: {
        name: '',
        email: '',
        slug: '',
        initials: '',
        color: ''
      } as Person,
    editedAt: new Date(),
    editedBy: {
        name: '',
        email: '',
        slug: '',
        initials: '',
        color: ''
      } as Person,
  } as Goal
}
