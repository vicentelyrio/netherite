import { SegmentedControl } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { SettingRow } from '../SettingRow'

const millisecondsPerSecond = 1000

export function DurationSetting({
  label,
  hint,
  presets,
  value,
  onChange,
}: {
  readonly label: string
  readonly hint: string
  readonly presets: ReadonlyArray<number>
  readonly value: number
  readonly onChange: (ms: number) => void
}) {
  const { LL } = useI18nContext()
  const options = [...new Set([...presets, value])].sort((a, b) => a - b)
  return (
    <SettingRow label={label} hint={hint}>
      <SegmentedControl
        aria-label={label}
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        data={options.map((ms) => ({
          value: String(ms),
          label: LL.settings.duration.seconds({ seconds: ms / millisecondsPerSecond }),
        }))}
      />
    </SettingRow>
  )
}
