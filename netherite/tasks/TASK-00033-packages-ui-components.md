---
id: TASK-00033
aliases: [TASK-00033]
type: task
title: "`packages/ui` components"
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00006
state: backlog
depends_on: [TASK-00032]
---

# `packages/ui` components

- [ ] Mantine provider with the generated theme; `classNames` overrides to match the design; dark theme
- [ ] Wrappers over Mantine: Button, ActionIcon, Chip, Avatar, Card, Progress, RingProgress, SegmentedControl, Tabs, Switch, Tooltip, Menu, Modal, Drawer
- [ ] Domain components: TypeBadge, StatusPill, FreshnessLabel, Banner, EmptyState, Card states (hover, selected, drop target)
- [ ] Rail with keyboard shortcuts
- [ ] Only `packages/ui` imports Mantine (enforced by the [[TASK-00052]] lint rule)
- [ ] Component preview page (`/dev/ui` route in the app)
