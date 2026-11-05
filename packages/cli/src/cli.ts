import { Effect, Option } from 'effect'
import { Argument, Command, Flag } from 'effect/cli'
import { contextSync } from './commands/context'
import { importCommand } from './commands/import'
import { init } from './commands/init'
import { type FailOn, lintCommand } from './commands/lint'
import { mcpCommand } from './commands/mcp'
import { newItem } from './commands/new'
import { statsCommand, timelineCommand } from './commands/progress'
import { renumberCommand } from './commands/renumber'
import { scanCommand } from './commands/scan'
import { serveCommand } from './commands/serve'
import { templatesCommand } from './commands/templates'
import { type Env, type ExitCode, exitCodes } from './output'

const dir = Flag.String('dir').pipe(
  Flag.withAlias('C'),
  Flag.withDefault('.'),
  Flag.withDescription(
    'Folder to work in (default: the current one). The workspace is found by walking up from it.',
  ),
)
const jsonFlag = Flag.Boolean('json').pipe(
  Flag.withDefault(false),
  Flag.withDescription('Print machine-readable JSON instead of text.'),
)

const failOnChoices: ReadonlyArray<FailOn> = ['error', 'warning', 'info', 'never']

export const makeCli = (env: Env, state: { code: ExitCode }, version = '0.0.0') => {
  const finish = (code: ExitCode) =>
    Effect.sync(() => {
      state.code = code
    })

  const initCmd = Command.make(
    'init',
    {
      dir,
      content: Flag.String('content').pipe(
        Flag.withDefault('netherite'),
        Flag.withDescription('Folder for the items.'),
      ),
      update: Flag.Boolean('update').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Refresh the installed agent skills and AGENTS.md section. Skills you edited are kept.',
        ),
      ),
      noSkills: Flag.Boolean('no-skills').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Do not install agent skills, the AGENTS.md section or the agent ruleset.',
        ),
      ),
      json: jsonFlag,
    },
    (c) => Effect.flatMap(init(env, c), finish),
  ).pipe(
    Command.withDescription(
      'Set up Netherite in a repository: config, folders, .gitignore and agent skills.',
    ),
  )

  const newCmd = Command.make(
    'new',
    {
      dir,
      type: Argument.String('type').pipe(
        Argument.withDescription('goal, project, task, adr, doc, context or runbook'),
      ),
      title: Argument.String('title').pipe(
        Argument.variadic({ min: 1 }),
        Argument.withDescription('The title; several words are joined.'),
      ),
      set: Flag.KeyValuePair('set').pipe(
        Flag.withDefault({}),
        Flag.withDescription('Set a field: --set project=PRJ-00001 (repeatable; values are YAML).'),
      ),
      body: Flag.String('body').pipe(
        Flag.optional,
        Flag.withDescription('Text for after the title.'),
      ),
      bodyFile: Flag.String('body-file').pipe(
        Flag.optional,
        Flag.withDescription('Read the text from a file.'),
      ),
      createdBy: Flag.String('created-by').pipe(
        Flag.optional,
        Flag.withDescription('@handle to record. Default: from git config.'),
      ),
      template: Flag.Boolean('template').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          "Start from the type's template, with its sections. --body and --body-file replace it.",
        ),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        newItem(env, {
          dir: c.dir,
          type: c.type,
          title: c.title,
          set: c.set,
          body: Option.getOrUndefined(c.body),
          bodyFile: Option.getOrUndefined(c.bodyFile),
          createdBy: Option.getOrUndefined(c.createdBy),
          template: c.template,
          json: c.json,
        }),
        finish,
      ),
  ).pipe(Command.withDescription('Create an item with the next free ID.'))

  const scanCmd = Command.make(
    'scan',
    {
      dir,
      out: Flag.String('out').pipe(
        Flag.optional,
        Flag.withDescription(
          'Where to write the draft batch, from the workspace root. Default: .netherite/local/scan.json.',
        ),
      ),
      nestedAgentFiles: Flag.Boolean('nested-agent-files').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Include the AGENTS.md and CLAUDE.md files deep in the tree. They are left out by default: agents read them in place, and they would fill the context budget.',
        ),
      ),
      force: Flag.Boolean('force').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Replace a draft that is already there.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        scanCommand(env, {
          dir: c.dir,
          out: Option.getOrUndefined(c.out),
          nestedAgentFiles: c.nestedAgentFiles,
          force: c.force,
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Look through the repository for docs, runbooks, decision records and agent files, and write a draft batch for `netherite import`. It only reads, and writes nothing but the draft.',
    ),
  )

  const importCmd = Command.make(
    'import',
    {
      dir,
      file: Argument.String('batch').pipe(
        Argument.withDescription(
          'A JSON file: a list of entries, or { "mode": "copy", "entries": [...] }. Each entry has source, type (doc, runbook, context or adr) and optionally title, id, fields, body and mode. `netherite scan` writes a draft of one.',
        ),
      ),
      update: Flag.Boolean('update').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Bring items that were already imported up to date with their source.',
        ),
      ),
      dryRun: Flag.Boolean('dry-run').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Say what would happen and write nothing.'),
      ),
      stub: Flag.Boolean('stub').pipe(
        Flag.withDefault(false),
        Flag.withDescription('With mode "move", leave a one-line note where the original was.'),
      ),
      createdBy: Flag.String('created-by').pipe(
        Flag.optional,
        Flag.withDescription('@handle to record. Default: from git config.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        importCommand(env, {
          dir: c.dir,
          file: c.file,
          update: c.update,
          dryRun: c.dryRun,
          stub: c.stub,
          createdBy: Option.getOrUndefined(c.createdBy),
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Bring existing docs, runbooks, context files and ADRs in from a reviewed batch file. Records where each came from, skips what is already imported, and never commits.',
    ),
  )

  const templatesCmd = Command.make(
    'templates',
    {
      dir,
      type: Argument.String('type').pipe(
        Argument.optional,
        Argument.withDescription(
          'goal, project, task, adr, doc, context or runbook. Without it, list them.',
        ),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        templatesCommand(env, { dir: c.dir, type: Option.getOrUndefined(c.type), json: c.json }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'List the starter templates, or print one to copy. A file in templates/ in the content folder replaces the built-in one.',
    ),
  )

  const lintCmd = Command.make(
    'lint',
    {
      dir,
      paths: Argument.String('path').pipe(
        Argument.variadic(),
        Argument.withDescription('Only report on these files or folders.'),
      ),
      json: jsonFlag,
      fix: Flag.Boolean('fix').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Apply the fixes lint offers (never commits).'),
      ),
      dryRun: Flag.Boolean('dry-run').pipe(
        Flag.withDefault(false),
        Flag.withDescription('With --fix: show the diff and change nothing.'),
      ),
      failOn: Flag.String('fail-on').pipe(
        Flag.withDefault('error'),
        Flag.withDescription(
          'Exit 1 when a problem at least this serious is left: error, warning, info or never.',
        ),
      ),
      noGit: Flag.Boolean('no-git').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Skip checks that need git history (freshness).'),
      ),
    },
    (c) => {
      if (!(failOnChoices as ReadonlyArray<string>).includes(c.failOn)) {
        env.out.error(`--fail-on must be one of ${failOnChoices.join(', ')}`)
        return finish(exitCodes.usage as ExitCode)
      }
      return Effect.flatMap(lintCommand(env, { ...c, failOn: c.failOn as FailOn }), finish)
    },
  ).pipe(
    Command.withDescription(
      'Check the workspace. Exit 0 when clean, 1 when problems remain, 2 when it cannot run.',
    ),
  )

  const renumberCmd = Command.make(
    'renumber',
    {
      dir,
      target: Argument.String('item').pipe(Argument.withDescription('Path or ID of an item.')),
      to: Flag.String('to').pipe(
        Flag.optional,
        Flag.withDescription('Use this ID instead of the next free one.'),
      ),
      rewriteIn: Flag.String('rewrite-in').pipe(
        Flag.atLeast(0),
        Flag.withDescription('A file whose links to the old ID should follow it (repeatable).'),
      ),
      exact: Flag.Boolean('exact').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Renumber exactly this item, not the newest one that shares its ID.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        renumberCommand(env, {
          dir: c.dir,
          target: c.target,
          to: Option.getOrUndefined(c.to),
          rewriteIn: c.rewriteIn,
          exact: c.exact,
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Give an item a new ID and update links to it. Resolves ID collisions after a merge.',
    ),
  )

  const mcpCmd = Command.make(
    'mcp',
    {
      dir,
      noWatch: Flag.Boolean('no-watch').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Do not watch for changes made outside the server.'),
      ),
    },
    (c) => Effect.flatMap(mcpCommand(env, { ...c, version }), finish),
  ).pipe(
    Command.withDescription(
      "Serve this workspace to an AI agent over MCP (stdio). Add it to your agent's MCP config.",
    ),
  )

  const contextSyncCmd = Command.make(
    'sync',
    {
      dir,
      check: Flag.Boolean('check').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Change nothing; exit 1 if CLAUDE.md or AGENTS.md is out of date.'),
      ),
      json: jsonFlag,
    },
    (c) => Effect.flatMap(contextSync(env, c), finish),
  ).pipe(
    Command.withDescription(
      'Write the context items into CLAUDE.md and AGENTS.md, between markers. Never commits.',
    ),
  )

  const contextCmd = Command.make('context').pipe(
    Command.withDescription('Work with the context given to agents.'),
    Command.withSubcommands([contextSyncCmd]),
  )

  const servePort = Flag.Int('port').pipe(
    Flag.optional,
    Flag.withDescription('Port to listen on (default 4747, or the next free one).'),
  )
  const serveFlags = {
    dir,
    port: servePort,
    noOpen: Flag.Boolean('no-open').pipe(
      Flag.withDefault(false),
      Flag.withDescription('Do not open the browser.'),
    ),
    app: Flag.String('app').pipe(
      Flag.optional,
      Flag.withDescription('Serve this built app folder instead of the bundled one.'),
    ),
    noWatch: Flag.Boolean('no-watch').pipe(
      Flag.withDefault(false),
      Flag.withDescription('Do not watch for changes made outside the server.'),
    ),
  }
  const serve = (c: {
    dir: string
    port: Option.Option<number>
    noOpen: boolean
    app: Option.Option<string>
    noWatch: boolean
  }) =>
    Effect.flatMap(
      serveCommand(env, {
        dir: c.dir,
        port: Option.getOrUndefined(c.port),
        noOpen: c.noOpen,
        app: Option.getOrUndefined(c.app),
        noWatch: c.noWatch,
        version,
      }),
      finish,
    )
  const serveCmd = Command.make('serve', serveFlags, serve).pipe(
    Command.withDescription(
      'Start the app, the API and MCP over HTTP on this machine (127.0.0.1 only). This is what `netherite` does with no command.',
    ),
  )

  const timelineCmd = Command.make(
    'timeline',
    {
      dir,
      from: Flag.String('from').pipe(
        Flag.optional,
        Flag.withDescription('First day, such as 2026-01-01. Default: the earliest date.'),
      ),
      to: Flag.String('to').pipe(
        Flag.optional,
        Flag.withDescription('Last day. Default: today, or the latest due date.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        timelineCommand(env, {
          dir: c.dir,
          from: Option.getOrUndefined(c.from),
          to: Option.getOrUndefined(c.to),
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Goals, projects, tasks and decisions on one time axis, read from git history. Needs git.',
    ),
  )

  const statsCmd = Command.make(
    'stats',
    {
      dir,
      period: Flag.String('period').pipe(
        Flag.withDefault('30d'),
        Flag.withDescription('30d, quarter or year.'),
      ),
      json: jsonFlag,
    },
    (c) => Effect.flatMap(statsCommand(env, c), finish),
  ).pipe(
    Command.withDescription(
      'Tasks created and done, cycle time, goal areas and knowledge health for a period, against the one before. Needs git.',
    ),
  )

  return Command.make('netherite', serveFlags, serve).pipe(
    Command.withDescription(
      'Typed, linked knowledge in your git repository. Documentation: https://vicentelyrio.github.io/netherite/',
    ),
    Command.withSubcommands([
      initCmd,
      newCmd,
      scanCmd,
      importCmd,
      templatesCmd,
      lintCmd,
      renumberCmd,
      mcpCmd,
      contextCmd,
      timelineCmd,
      statsCmd,
      serveCmd,
    ]),
  )
}

export const runCli = (argv: ReadonlyArray<string>, env: Env, version = '0.0.0') => {
  const state = { code: exitCodes.ok as ExitCode }
  const root = makeCli(env, state, version)
  return Command.runWith(root, { version })(argv).pipe(
    Effect.map(() => state.code),
    Effect.catch(() => Effect.succeed(exitCodes.usage as ExitCode)),
  )
}
