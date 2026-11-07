import type { TranslationFunctions } from '@/infrastructure/i18n'
import type { ActionId } from '@/infrastructure/shortcuts'

const labelKey = (id: ActionId) =>
  id.replace(/\.(\w)/, (_, letter: string) =>
    letter.toUpperCase(),
  ) as keyof TranslationFunctions['settings']['actions']

export const actionLabel = (LL: TranslationFunctions, id: ActionId) =>
  LL.settings.actions[labelKey(id)]()
