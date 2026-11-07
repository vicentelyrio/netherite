import { Card } from '@mantine/core'
import { cardClasses } from './Card.classes'

export const cardTheme = Card.extend({
  classNames: cardClasses,
  defaultProps: { padding: 0, radius: 'md', withBorder: true },
})
