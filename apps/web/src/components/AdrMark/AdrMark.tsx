import { Link } from '@tanstack/react-router'
import './AdrMark.css'

/** The ADR glyph: a diamond, filled while in force, hollow once superseded. */
export function AdrDiamond({ hollow }: { readonly hollow?: boolean }) {
  return <span className="adr-diamond" data-hollow={hollow || undefined} />
}

/** An ADR's ID as a link to it, in the ADR colour. */
export function AdrIdLink({ id }: { readonly id: string }) {
  return (
    <Link to="/items/$id" params={{ id }} className="adr-id-link">
      {id}
    </Link>
  )
}
