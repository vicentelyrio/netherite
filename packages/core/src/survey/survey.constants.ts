import { settingDefaults } from '@netherite/schema'
import type { SkipReason } from './survey.types'

export const labels: Record<SkipReason, string> = {
  'already-imported': 'already imported',
  'nested-agent-file':
    'per-folder agent files (agents read them in place; they would fill the context budget)',
  stub: 'stubs that only point at another file',
  'managed-by-a-tool': 'folders another tool manages and rewrites',
  'not-documentation': 'changelogs, licences and similar',
  template: 'templates',
  'test-data': 'test fixtures, golden files and snapshots',
  'decision-index': 'the index of a decision record folder (the records are the content)',
  'maybe-a-secret': 'files that look like they hold a secret (not read into the batch)',
  'too-large': 'files over 1 MB',
}

export const pruned = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  '.parcel-cache',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.tox',
  '.gradle',
  '.idea',
  '.vscode',
  '.yarn',
  '.pnpm-store',
  '.terraform',
])

export const managedFolders = new Set([
  'openspec',
  '.changeset',
  '.changes',
  'changelog.d',
  '.vitepress',
])

export const hiddenKept = new Set(['.ai', '.claude', '.cursor', '.github', '.agents'])

export const markdown = /\.(md|mdx|mdc|markdown)$/i

export const agentFile = /^(AGENTS|CLAUDE|GEMINI)\.md$/

export const notDocs =
  /^(changelog|changes|history|license|licence|copying|notice|authors|contributors|code_of_conduct)(\.[a-z]+)?$/i

export const templateName =
  /(^|[-_.])(template|tpl)([-_.]|$)|^_template|issue_template|pull_request_template/i

export const secretPattern =
  /(npm_[A-Za-z0-9]{36}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})/

export const adrFolder = /(^|\/)(adrs?|decisions?|architecture-decisions?|rfcs?|arch)(\/|$)/i

export const runbookWords = /(^|[/_.-])(runbooks?|playbooks?|on-?call|oncall|incident)([/_.-]|$)/i

export const maxBytes = settingDefaults.migration.surveyMaxBytes

export const examplesPerGroup = settingDefaults.migration.surveyExamples
