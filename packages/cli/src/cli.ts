import { Effect, Option } from 'effect'
import { Argument, Command, Flag } from 'effect/cli'
import { init } from './commands/init'
import { type FailOn, lintCommand } from './commands/lint'
import { newItem } from './commands/new'
import { renumberCommand } from './commands/renumber'
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

/** The command tree. Each handler stores its exit code in `state`, which `runCli` returns. */
export const makeCli = (env: Env, state: { code: ExitCode }) => {
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
      json: jsonFlag,
    },
    (c) => Effect.flatMap(init(env, c), finish),
  ).pipe(
    Command.withDescription('Set up Netherite in a repository: config, folders and .gitignore.'),
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
          json: c.json,
        }),
        finish,
      ),
  ).pipe(Command.withDescription('Create an item with the next free ID.'))

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

  return Command.make('netherite').pipe(
    Command.withDescription('Typed, linked knowledge in your git repository.'),
    Command.withSubcommands([initCmd, newCmd, lintCmd, renumberCmd]),
  )
}

/**
 * Runs the CLI with the given arguments and resolves to the exit code. Output goes to `env.out`,
 * except help and usage errors, which `effect/cli` prints itself.
 */
export const runCli = (argv: ReadonlyArray<string>, env: Env, version = '0.0.0') => {
  const state = { code: exitCodes.ok as ExitCode }
  const root = makeCli(env, state)
  return Command.runWith(root, { version })(argv).pipe(
    Effect.map(() => state.code),
    // A usage error (unknown flag, missing argument): effect/cli has printed the reason.
    Effect.catch(() => Effect.succeed(exitCodes.usage as ExitCode)),
  )
}
