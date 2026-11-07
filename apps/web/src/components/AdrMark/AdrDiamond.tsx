import './AdrMark.css'

export function AdrDiamond({ hollow }: { readonly hollow?: boolean }) {
  return <span className="adr-diamond" data-hollow={hollow || undefined} />
}
