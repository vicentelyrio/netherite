import { Service } from 'typedi'

import {
  Resolver,
  Query,
  Arg,
} from 'type-graphql'

import { UI } from './UI.type'
import { UIService } from './UI.service'

@Service()
@Resolver(() => UI)
export class UIResolver {
  constructor(private readonly service: UIService) {}

  @Query(() => UI, { description: 'Get the UI by name' })
  async getUIByName(@Arg('name') name: string): Promise<UI> {
    return await this.service.getUIByName(name)
  }

  @Query(() => [UI], { description: 'Get all the UIs' })
  async getUIs(): Promise<UI[]> {
    return await this.service.getUIs()
  }
}
