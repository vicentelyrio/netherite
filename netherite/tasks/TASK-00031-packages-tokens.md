---
id: TASK-00031
aliases: [TASK-00031]
type: task
title: "`packages/tokens`"
created: 2026-11-01T23:50:43Z
created_by: "@vicentelyrio"
project: PRJ-00006
state: done
depends_on: [TASK-00003]
---

# `packages/tokens`

- [x] Colour, type, spacing and radius tokens from the "Netherite Refined" token sheets (T1, T2)
- [x] Type colours and glyph shapes, ADR status, freshness, graph node and edge styles, syntax colours
- [x] Output as CSS variables, TS constants and a Mantine theme (`createTheme`)

## Notes

Values come from the Netherite Refined design (Claude Design project "Netherite UI Refinement": Tokens.dc.html for T1, TokensKnowledge.dc.html for T2, plus Rail.dc.html, Graph.dc.html, TaskDrawer.dc.html), read on 2026-11-02. An earlier first set was derived from [[DOC-00001]] and was replaced. The design is dark only, so there is no light scheme.\n\nNot in the design, chosen from its own colours: task state colours (`state.*`), edge kinds `depends_on`, `related` and `reference`, and badge glyphs for goals, projects and tasks (discs, as in the graph).\n\nKnown gap in the design: `text.lineNumber`, `syntax.punct` and `freshness.unknown` (#8A8FAD) are 4.0 to 4.4:1 on the canvas, columns and chips; 4.9:1 on the editor as the sheet says.
