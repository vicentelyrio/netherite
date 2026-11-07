import { useState } from 'react'
import { Button } from '../../Button'
import { Drawer } from '../../Drawer'
import { Group } from '../../Group'
import { Icon } from '../../Icon'
import { Menu } from '../../Menu'
import { Modal } from '../../Modal'
import { Tabs } from '../../Tabs'
import { Tooltip } from '../../Tooltip'
import { PreviewSection } from '../PreviewSection'

export function OverlaysSection() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  return (
    <PreviewSection title="Tabs, menu, tooltip">
      <Tabs defaultValue="tasks">
        <Tabs.List>
          <Tabs.Tab value="tasks">Tasks</Tabs.Tab>
          <Tabs.Tab value="docs">Docs</Tabs.Tab>
          <Tabs.Tab value="knowledge">Knowledge</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="tasks">Tasks board goes here.</Tabs.Panel>
        <Tabs.Panel value="docs">Docs and runbooks.</Tabs.Panel>
        <Tabs.Panel value="knowledge">Everything linked to the project.</Tabs.Panel>
      </Tabs>
      <Group gap="sm">
        <Menu>
          <Menu.Target>
            <Button icon="expand_more">Menu</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Item</Menu.Label>
            <Menu.Item leftSection={<Icon name="edit" />}>Rename</Menu.Item>
            <Menu.Item leftSection={<Icon name="link" />}>Copy ID</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="danger" leftSection={<Icon name="delete" />}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Tooltip label="Opens after a short pause" position="bottom">
          <Button variant="subtle">Hover for a tooltip</Button>
        </Tooltip>
        <Button onClick={() => setModal(true)}>Open modal</Button>
        <Button onClick={() => setDrawer(true)}>Open drawer</Button>
      </Group>
      <Modal opened={modal} onClose={() => setModal(false)} title="Delete TASK-00042?">
        Other items link to it. Deleting it leaves those links broken.
        <Group justify="flex-end" mt="md">
          <Button onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => setModal(false)}>
            Delete anyway
          </Button>
        </Group>
      </Modal>
      <Drawer opened={drawer} onClose={() => setDrawer(false)} title="TASK-00042">
        The task drawer shows the fields, the checklist and the related items.
      </Drawer>
    </PreviewSection>
  )
}
