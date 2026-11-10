---
"@vicentelyrio/netherite": patch
---

Fix the CLI crashing at startup with `Cannot find package 'redis'` on package managers that do not install peer dependencies, such as Yarn v1.
