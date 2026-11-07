export interface MoveOption {
  readonly id: string
  readonly title: string
  readonly detail?: string
  readonly progress?: { readonly done: number; readonly total: number }
  readonly current: boolean
}

export interface MoveGroup {
  readonly label: string
  readonly options: ReadonlyArray<MoveOption>
}

export interface MovePickerProps {
  readonly opened: boolean
  readonly title: string
  readonly groups: ReadonlyArray<MoveGroup>
  readonly currentLabel?: string
  readonly onPick: (id: string) => void
  readonly onClose: () => void
}
