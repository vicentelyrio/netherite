import { HttpApi } from 'effect/http-api'
import { ConfigGroup } from './config'
import { EventsGroup } from './events'
import { GoalsGroup } from './goals'
import { GraphGroup } from './graph'
import { HistoryGroup } from './history'
import { InboxGroup } from './inbox'
import { ItemsGroup } from './items'
import { KnowledgeGroup } from './knowledge'
import { LintGroup, LintTextGroup } from './lint'
import { MetaGroup } from './meta'
import { ProjectsGroup } from './projects'
import { SearchGroup } from './search'
import { StatsGroup } from './stats'
import { TagsGroup } from './tags'
import { TimelineGroup } from './timeline'

export class NetheriteApi extends HttpApi.make('netherite')
  .add(
    ItemsGroup,
    SearchGroup,
    GraphGroup,
    GoalsGroup,
    ProjectsGroup,
    KnowledgeGroup,
    TagsGroup,
    LintGroup,
    LintTextGroup,
    InboxGroup,
    HistoryGroup,
    StatsGroup,
    TimelineGroup,
    EventsGroup,
    MetaGroup,
    ConfigGroup,
  )
  .prefix('/api') {}
