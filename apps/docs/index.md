---
layout: home
title: Netherite Docs
titleTemplate: false
hero:
  name: Netherite
  text: A typed, linked knowledge base in Markdown and git
  tagline: Goals, projects, tasks, decisions, docs and runbooks as plain files in your repository. Edit them anywhere, let agents read and write them, and see them in a local app.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Install
      link: /install
    - theme: alt
      text: For agents
      link: /agents
features:
  - title: Plain files
    details: Every item is a Markdown file with YAML frontmatter, linked by ID. There is no database, no account and no cloud.
  - title: For agents
    details: An MCP server and a few skills let an agent search, plan and update work with the same checks you get.
  - title: A local app
    details: Boards, a graph, a timeline, stats and an inbox, over your own files. Every edit is a change to a file; nothing is committed for you.
---

```sh
cd my-repo
npx @vicentelyrio/netherite init
npx @vicentelyrio/netherite
```

<video class="home-tour" src="/netherite-tour.mp4" poster="/netherite-tour.jpg" autoplay loop muted playsinline aria-label="A tour of the Netherite app: goals, a project board, a task, the graph, the knowledge index, the timeline, the decision log, stats, tags and the theme setting"></video>
