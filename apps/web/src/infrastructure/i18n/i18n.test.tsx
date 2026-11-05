import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { I18nProvider, useI18nContext } from '.'

function Probe({ count }: { readonly count: number }) {
  const { LL, locale } = useI18nContext()
  return (
    <p>
      {locale} · {LL.status.live()} · {LL.status.items({ count })}
    </p>
  )
}

const show = (count: number) =>
  render(
    <I18nProvider>
      <Probe count={count} />
    </I18nProvider>,
  )

describe('i18n', () => {
  test('gives components the English words', () => {
    show(3)
    expect(screen.getByText(/en · Live/)).toBeTruthy()
  })

  test('messages take values, and plurals follow the count', () => {
    const { unmount } = show(1)
    expect(screen.getByText(/1 item$/)).toBeTruthy()
    unmount()
    show(127)
    expect(screen.getByText(/127 items$/)).toBeTruthy()
  })
})
