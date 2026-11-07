import { type Theme, themes } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useTheme } from '@/infrastructure/settings'
import { SettingRow } from '../SettingRow'
import './ThemeSetting.css'

const swatches = (theme: Theme) => {
  const { bg, accent, status } = theme.colors
  return [bg.canvas, accent.solid, status.success, status.warning, status.danger]
}

export function ThemeSetting() {
  const { LL } = useI18nContext()
  const text = LL.settings.general
  const { theme: current, setTheme } = useTheme()
  return (
    <SettingRow label={text.theme()} hint={text.themeHint()}>
      <div className="th-list" role="radiogroup" aria-label={text.theme()}>
        {themes.map((theme) => (
          <label
            key={theme.id}
            className="th-option"
            data-active={theme.id === current.id || undefined}
          >
            <input
              type="radio"
              className="nt-visually-hidden"
              name="theme"
              checked={theme.id === current.id}
              onChange={() => setTheme(theme.id)}
            />
            <span className="th-swatches" aria-hidden="true">
              {swatches(theme).map((swatch) => (
                <span key={swatch} className="th-swatch" style={{ background: swatch }} />
              ))}
            </span>
            {theme.name}
          </label>
        ))}
      </div>
    </SettingRow>
  )
}
