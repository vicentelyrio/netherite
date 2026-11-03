import './SearchFooter.css'

/** The keys the palette answers to, and how many results there are. */
export function SearchFooter({ count }: { readonly count: number }) {
  return (
    <footer className="sp-foot">
      <span>
        <kbd>↑↓</kbd>navigate
      </span>
      <span>
        <kbd>↵</kbd>open
      </span>
      <span>
        <kbd>⌘↵</kbd>open as split
      </span>
      <span>
        <kbd>tab</kbd>next type
      </span>
      <span className="sp-spacer" />
      <span>{count} results · titles, paths and body</span>
    </footer>
  )
}
