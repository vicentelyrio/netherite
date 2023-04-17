/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Box, Grid, Text } from 'theme-ui'

export const CardList = styled(Grid)()

CardList.defaultProps = {
  columns: 'auto',
  sx: {
    gap: 4,
    gridColumn: 'span 5',
    alignContent: 'start'
  }
}

export const Header = styled(Box)()

export const Title = styled(Text)()

Title.defaultProps = {
  variant: 'h3',
  as: 'h2'
}

export const Description = styled(Text)()

Description.defaultProps = {
  variant: 'bodyMedium',
  as: 'p',
  sx: {
    color: 'textMuted'
  }
}

