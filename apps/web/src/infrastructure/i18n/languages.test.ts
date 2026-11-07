import { describe, expect, test } from 'vitest'
import { languages, resolveLocale } from './languages'

describe('choosing a language from the browser', () => {
  test.each([
    [['es-MX', 'en'], 'es'],
    [['pt-PT'], 'pt-BR'],
    [['pt-br'], 'pt-BR'],
    [['PT'], 'pt-BR'],
    [['en-GB', 'es'], 'en'],
    [['fr-FR', 'es-ES', 'en'], 'es'],
    [['ja', 'de'], 'en'],
    [['constructor'], 'en'],
    [[], 'en'],
  ])('%j gives %s', (browser, locale) => {
    expect(resolveLocale(browser)).toBe(locale)
  })

  test('every language is named in its own words', () => {
    expect(languages.map((l) => l.name)).toEqual(['English', 'Español', 'Português (Brasil)'])
  })
})
