import { NetheriteProvider } from '@netherite/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { TimeScrubber, type TimeScrubberProps } from './TimeScrubber'

const show = (props: Partial<TimeScrubberProps> = {}) => {
  const handlers = { onChange: vi.fn(), onPlayToggle: vi.fn(), onToday: vi.fn() }
  render(
    <NetheriteProvider env="test">
      <I18nProvider>
        <TimeScrubber
          from="2026-01-01"
          to="2026-01-31"
          value="2026-01-31"
          activity={[
            { week: '2025-12-29', count: 2 },
            { week: '2026-01-26', count: 0 },
          ]}
          playing={false}
          {...handlers}
          {...props}
        />
      </I18nProvider>
    </NetheriteProvider>,
  )
  return handlers
}

describe('TimeScrubber', () => {
  test('moving the slider gives the day, and Today is off while on today', () => {
    const h = show()
    expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled()
    fireEvent.change(screen.getByRole('slider', { name: 'Date' }), { target: { value: '10' } })
    expect(h.onChange).toHaveBeenCalledWith('2026-01-11')
  })

  test('shows the day, and on a past day Today and play call back', () => {
    const h = show({ value: '2026-01-11' })
    expect(screen.getByText('11 Jan 2026')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(h.onToday).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(h.onPlayToggle).toHaveBeenCalled()
  })

  test('says Pause while playing', () => {
    show({ playing: true })
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
  })
})
