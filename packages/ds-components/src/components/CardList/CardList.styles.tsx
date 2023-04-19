/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Box, Grid, Heading, Text } from 'theme-ui'

export const CardList = styled(Grid)({
  columns: 'auto',
  alignContent: 'start',
})

CardList.defaultProps = {
  variant: 'cardList',
}

export const Header = styled(Box)()

export const Title = styled(Heading)()

Title.defaultProps = {
  variant: 'h3',
  as: 'h2'
}

export const Description = styled(Text)()

Description.defaultProps = {
  variant: 'bodyMedium',
  sx: {
    color: 'textMuted'
  }
}

