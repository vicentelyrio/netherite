import { Link } from '@tanstack/react-router'
import './AdrMark.css'

export function AdrIdLink({ id }: { readonly id: string }) {
  return (
    <Link to="/items/$id" params={{ id }} className="adr-id-link">
      {id}
    </Link>
  )
}
