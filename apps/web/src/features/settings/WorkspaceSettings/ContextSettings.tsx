import { ContextTarget } from '@netherite/schema'
import { useI18nContext } from '@/infrastructure/i18n'
import { NumberSetting } from '../NumberSetting'
import { SettingsSection } from '../SettingsSection'
import { SwitchSetting } from '../SwitchSetting'
import type { WorkspaceSectionProps } from './WorkspaceSettings.types'

const targets = Object.values(ContextTarget)

export function ContextSettings({ settings, save }: WorkspaceSectionProps) {
  const { LL } = useI18nContext()
  const text = LL.settings.workspace.context
  const chosen = settings.context.targets
  const hints = {
    [ContextTarget.Claude]: text.targets.claudeHint,
    [ContextTarget.Agents]: text.targets.agentsHint,
    [ContextTarget.Mcp]: text.targets.mcpHint,
  }
  return (
    <SettingsSection title={text.title()} subtitle={text.subtitle()}>
      <NumberSetting
        label={text.budget()}
        hint={text.budgetHint()}
        value={settings.context.budget}
        onChange={(budget) => save({ context: { budget } })}
      />
      {targets.map((target) => (
        <SwitchSetting
          key={target}
          label={text.targets[target]()}
          hint={hints[target]()}
          checked={chosen.includes(target)}
          onChange={(on) =>
            save({
              context: {
                targets: on ? [...chosen, target] : chosen.filter((other) => other !== target),
              },
            })
          }
        />
      ))}
    </SettingsSection>
  )
}
