import { Link } from '@tanstack/react-router'
import './AdrMark.css'

export function AdrDiamond({ hollow }: { readonly hollow?: boolean }) {
  return <span className="adr-diamond" data-hollow={hollow || undefined} />
}

export function AdrIdLink({ id }: { readonly id: string }) {
  return (
    <Link to="/items/$id" params={{ id }} className="adr-id-link">
      {id}
    </Link>
  )
}
