import { EmptyState } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'

export function NoTags() {
  const { LL } = useI18nContext()
  return <EmptyState icon="sell" title={LL.tags.empty.title()} description={LL.tags.empty.text()} />
}
