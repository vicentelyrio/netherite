# Install

Netherite is one npm package, `@vicentelyrio/netherite`. It holds the command line, the local app,
the MCP server for agents and the agent skills. It runs on **Node 24 or newer** (tested on 24 and 26, both long-term support lines), in a git repository.
Check your Node with `node --version`.

## Pick how to run it

**With `npx`, nothing to install.** Every command in these docs starts with `npx
@vicentelyrio/netherite`. The first run downloads the package and later runs reuse it.

```sh
npx @vicentelyrio/netherite init
```

**Globally, for a short command.** After this, `netherite` works anywhere.

```sh
npm install --global @vicentelyrio/netherite
netherite init
```

**In a project, pinned to a version.** Use this when a team should all run the same version, or when
CI runs `netherite lint`.

```sh
npm install --save-dev @vicentelyrio/netherite
npm exec -- netherite lint
```

The package is called `@vicentelyrio/netherite`, but the command it installs is `netherite`. Inside
a project that has it as a dependency, and after a global install, you type `netherite`. With `npx`
and nothing installed, you type the full package name.

## Set up a repository

```sh
cd my-repo
npx @vicentelyrio/netherite init
```

`init` only adds files and is safe to run again:

| It adds | What it is for |
| --- | --- |
| `.netherite/config.yml` | settings, see [configuration](reference/config.md) |
| `netherite/` with one folder per item type | where your goals, projects, tasks, decisions, docs and runbooks live |
| a line in `.gitignore` for `.netherite/local/` | per-user state such as the agent activity log |
| `.claude/skills/netherite-*` | the agent skills, see [agents](agents.md) |
| a section in `AGENTS.md`, between `netherite:skills` markers | a short note telling any agent how this repository tracks work |
| `.netherite/skills.json` | a record of the installed skills, so your edits are kept on upgrade |
| a context item, "How agents work in this repository", and `CLAUDE.md` | the ruleset every agent reads: plan first, track as you go, record decisions, ask when it is your call; see [agents](agents.md) |

Options: `--content docs/tracker` keeps the items somewhere other than `netherite/`, and
`--no-skills` leaves the skills, `AGENTS.md` and the ruleset alone. Then start the app with `npx
@vicentelyrio/netherite`, or carry on with [getting started](getting-started.md).

Netherite never commits for you. Look at `git status`, then commit the result when you are happy.

## Upgrade

```sh
npx @vicentelyrio/netherite@latest init --update     # npx
npm update --global @vicentelyrio/netherite          # global install
npm update @vicentelyrio/netherite                   # dependency of a project
```

After upgrading, run `netherite init --update` once in each repository. It replaces skills and the
`AGENTS.md` section that you have not edited, keeps the ones you have, and says which is which.
Without `--update`, `init` tells you when a skill is out of date.

## Uninstall

1. Remove the package: `npm uninstall --global @vicentelyrio/netherite` (or without `--global` in a project).
2. Remove what `init` added, if you want to: `.netherite/`, `.claude/skills/netherite-*`, the block
   between the `netherite:skills` markers in `AGENTS.md`, and the `.gitignore` line.
3. Your items in `netherite/` are plain Markdown. They stay readable and keep working in any editor.

## If something does not work

| You see | Why | What to do |
| --- | --- | --- |
| `No Netherite workspace found from …` | you are outside the repository, or `init` has not run | `cd` into the repository, or run `init` |
| writes in the app fail with `Unauthorized` | the page was loaded from an earlier server, so its token no longer matches | reload the page; if you started a second server, close the first |
| `Port … is already in use` | you asked for a port with `--port` and something else has it | pick another, or leave `--port` off: the app then takes the next free one from 4747 and prints it |
| a skill is reported `outdated` | the package was upgraded | `netherite init --update` |
| `init` reports damaged markers in `AGENTS.md` | someone edited the `netherite:skills` markers | restore the two marker lines by hand, then run `init --update` |
| the agent cannot find the workspace | it runs in a different folder | start the agent in the repository, or pass `--dir` in its MCP config |

More: [agents](agents.md) covers connecting an agent, and [lint](reference/lint.md) lists what
`netherite lint` checks.
