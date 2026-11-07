---
'@vicentelyrio/netherite': minor
---

Clearer decisions and review dates in Knowledge.

- **ADR decisions.** The highlighted box in an ADR now comes from a Markdown blockquote instead of the `Decision` heading, so it also reads properly outside the app. The ADR template and the `netherite-discover` skill write the decision as a blockquote. Existing ADRs need `>` added to the text they want highlighted.
- **Review dates.** The review button shows "Reviewed at" and the date once an item has been reviewed, and it is disabled for the rest of that day. A tooltip explains what reviewing does.
- **Opening documents.** Knowledge rows open on double click. A single click shows the preview.
