import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { BarChart, LineChart, niceMax, StackedBarChart } from '.'

describe('niceMax', () => {
  test('an axis tops out at a round number above the data', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(3)).toBe(3)
    expect(niceMax(7)).toBe(8)
    expect(niceMax(23)).toBe(24)
    expect(niceMax(180)).toBe(200)
  })
})

describe('charts', () => {
  const wrap = (ui: React.ReactElement) =>
    render(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

  test('a bar chart is a labelled image with a bar and a tooltip per week', () => {
    wrap(
      <BarChart
        label="Done per week"
        data={[
          { week: '2026-10-26', count: 3 },
          { week: '2026-11-02', count: 5 },
        ]}
      />,
    )
    const chart = screen.getByRole('img', { name: 'Done per week' })
    expect(chart.querySelectorAll('rect')).toHaveLength(2)
    expect(chart.textContent).toContain('26 Oct: 3')
  })

  test('a stacked chart leaves out empty parts', () => {
    wrap(
      <StackedBarChart
        label="ADRs"
        parts={['a', 'b']}
        colors={{ a: '#111', b: '#222' }}
        data={[{ week: '2026-10-26', a: 2, b: 0 }]}
      />,
    )
    expect(screen.getByRole('img', { name: 'ADRs' }).querySelectorAll('rect')).toHaveLength(1)
  })

  test('a line chart draws a path per series that has points', () => {
    wrap(
      <LineChart
        label="Progress"
        weeks={['2026-10-26', '2026-11-02']}
        series={[
          {
            id: 'g',
            title: 'Goal',
            color: '#f00',
            points: [
              { week: '2026-10-26', value: 10 },
              { week: '2026-11-02', value: 40 },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: 'Progress' }).querySelectorAll('path')).toHaveLength(1)
  })
})
