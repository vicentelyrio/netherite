import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Highlight } from './Highlight'

describe('Highlight', () => {
  test('marks the first match, ignoring case', () => {
    const { container } = render(<Highlight text="Use GNU Stow for symlinks" q="stow" />)
    expect(container.querySelector('mark')?.textContent).toBe('Stow')
    expect(container.textContent).toBe('Use GNU Stow for symlinks')
  })

  test('no query or no match leaves the text alone', () => {
    expect(render(<Highlight text="abc" q="  " />).container.querySelector('mark')).toBeNull()
    expect(render(<Highlight text="abc" q="z" />).container.querySelector('mark')).toBeNull()
  })
})
