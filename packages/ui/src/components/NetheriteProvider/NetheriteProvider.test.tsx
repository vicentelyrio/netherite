import { waitFor } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Icon } from '../Icon'

describe('icons before the font arrives', () => {
  test('the provider marks the page when icons can be shown, so names never flash as text', async () => {
    document.documentElement.removeAttribute('data-nt-icons')
    renderUi(<Icon name="check" />)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-nt-icons', 'ready'))
  })
})
