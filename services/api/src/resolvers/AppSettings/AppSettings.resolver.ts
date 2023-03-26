import { Service } from 'typedi'

import { Resolver, Query } from 'type-graphql'

import { AppSettings } from './AppSettings.type'
import { AppSettingsService } from './AppSettings.service'

@Service()
@Resolver(() => AppSettings)
export class AppSettingsResolver {
  constructor(private readonly service: AppSettingsService) {}

  @Query(() => AppSettings, { description: 'Get the App Settings' })
  async getAppSettings(): Promise<AppSettings> {
    return await this.service.getAppSettings()
  }
}
