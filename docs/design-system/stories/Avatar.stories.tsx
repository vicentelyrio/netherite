import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Avatar } from '@netherite/ds-components'

export default {
  title: 'UI/Avatar',
  component: Avatar,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Avatar>

const Template: ComponentStory<typeof Avatar> = (args) => <Avatar {...args} />

export const Primary = Template.bind({})

Primary.args = {
  label: 'Avatar',
}
