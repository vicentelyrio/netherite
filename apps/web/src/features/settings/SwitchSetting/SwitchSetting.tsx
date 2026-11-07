import { Switch } from '@netherite/ui'
import { SettingRow } from '../SettingRow'

export function SwitchSetting({
  label,
  hint,
  checked,
  onChange,
}: {
  readonly label: string
  readonly hint: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <Switch
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </SettingRow>
  )
}
