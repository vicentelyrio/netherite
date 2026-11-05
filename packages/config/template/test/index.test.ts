import { expect, test } from 'vitest'
import { name } from '../src/index'

test('exports its name', () => {
  expect(name).toBe('PACKAGE_NAME')
})
