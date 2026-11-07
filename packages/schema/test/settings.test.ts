import { describe, expect, test } from 'vitest'
import { defaultConfig, SettingSource, settingCatalog, settingDefaults } from '../src/index'

describe('the settings catalog', () => {
  test('every setting has a unique key, a description and a known source', () => {
    const keys = settingCatalog.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const s of settingCatalog) {
      expect(s.description, s.key).not.toBe('')
      expect(Object.values(SettingSource), s.key).toContain(s.source)
    }
  })

  test('a setting people can change names where they change it', () => {
    const open = settingCatalog.filter((s) => s.source !== SettingSource.Constant)
    for (const s of open) expect(s.locator, s.key).toBeDefined()
  })

  test('defaults respect their own limits', () => {
    for (const s of settingCatalog) {
      if (typeof s.default !== 'number') continue
      if (s.min !== undefined) expect(s.default, s.key).toBeGreaterThanOrEqual(s.min)
      if (s.max !== undefined) expect(s.default, s.key).toBeLessThanOrEqual(s.max)
    }
  })

  test('the config file starts from the same values as the catalog', () => {
    expect(defaultConfig.content).toBe(settingDefaults.content.folder)
    expect(defaultConfig.id_padding).toBe(settingDefaults.content.idPadding)
    expect(defaultConfig.states).toEqual(settingDefaults.content.states)
    expect(defaultConfig.freshness.stale).toBe(settingDefaults.freshness.stale)
    expect(defaultConfig.freshness.drifting).toBe(settingDefaults.freshness.drifting)
    expect(defaultConfig.context.budget).toBe(settingDefaults.context.budget)
    expect(defaultConfig.context.targets).toEqual(settingDefaults.context.targets)
  })
})
