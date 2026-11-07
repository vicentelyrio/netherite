export interface SearchSelectProps {
  readonly label: string
  readonly placeholder: string
  readonly options: ReadonlyArray<string>
  readonly value: string | undefined
  readonly onChange: (value: string | undefined) => void
  readonly nothingFound: string
  readonly width?: number
}
