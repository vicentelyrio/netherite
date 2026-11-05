import { Grid, NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { CardColumn } from './CardColumn'

describe('CardColumn', () => {
  test('holds its cards and can be named as a region', () => {
    render(
      <NetheriteProvider env="test">
        <Grid>
          <CardColumn label="Life">
            <p>card</p>
          </CardColumn>
        </Grid>
      </NetheriteProvider>,
    )
    expect(screen.getByRole('region', { name: 'Life' }).textContent).toBe('card')
  })
})
