import { useI18nContext } from '@/infrastructure/i18n'
import './SearchFooter.css'

export function SearchFooter({ count }: { readonly count: number }) {
  const { LL } = useI18nContext()
  return (
    <footer className="sp-foot">
      <span>
        <kbd>↑↓</kbd>
        {LL.search.footer.navigate()}
      </span>
      <span>
        <kbd>↵</kbd>
        {LL.search.footer.open()}
      </span>
      <span>
        <kbd>⌘↵</kbd>
        {LL.search.footer.split()}
      </span>
      <span>
        <kbd>tab</kbd>
        {LL.search.footer.next()}
      </span>
      <span className="sp-spacer" />
      <span>{LL.search.footer.results({ count })}</span>
    </footer>
  )
}
