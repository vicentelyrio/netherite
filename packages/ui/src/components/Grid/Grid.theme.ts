import { Grid } from '@mantine/core'
import { grid } from '@netherite/tokens'

export const gridTheme = Grid.extend({ defaultProps: { columns: grid.columns, gap: 'xl' } })
