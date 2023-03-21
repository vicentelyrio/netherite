import { Service } from 'typedi'

import {
  Resolver,
  Query,
  Arg,
} from 'type-graphql'

import { Page } from './Page.type'
import { PageService } from './Page.service'

@Service()
@Resolver(() => Page)
export class PageResolver {
  constructor(private readonly service: PageService) {}

  @Query(() => Page, { description: 'Get the Page by name' })
  async getPageByName(@Arg('name') name: string): Promise<Page> {
    return await this.service.getPageByName(name)
  }

  @Query(() => [Page], { description: 'Get all the Pages' })
  async getPages(): Promise<Page[]> {
    return await this.service.getPages()
  }
}
