import * as core from '@actions/core'
import { extractPRs, formatPRs } from './extract-pr-titles'
import { fetchPRAuthors } from './github'
import { simpleGit } from 'simple-git'

const run = async () => {
  const git = simpleGit(process.cwd())

  const format = core.getInput('format')
  const botFormat = core.getInput('bot-format')
  const bots = core
    .getInput('bots')
    .split(/[\s,]+/)
    .filter((b) => b)
  const token = core.getInput('github-token')

  const result = await git.log({
    from: core.getInput('from'),
    to: core.getInput('to'),
    symmetric: false,
  })
  core.info(`${result.all.length} commits`)
  result.all.forEach((log) => core.info(`- ${log.message}`))

  const prs = extractPRs(result.all, {
    reverse: core.getInput('reverse') == 'true',
  })

  // Without token, author falls back to the git commit author name
  // author is also needed to choose bot-format
  const needsAuthor = format.includes('{author}') || !!botFormat
  if (token && needsAuthor && prs.length > 0) {
    const authors = await fetchPRAuthors({
      token,
      repository: process.env.GITHUB_REPOSITORY,
      numbers: prs.map((pr) => pr.number),
      graphqlUrl: process.env.GITHUB_GRAPHQL_URL,
    })
    for (const pr of prs) {
      if (authors.has(pr.number)) {
        pr.author = authors.get(pr.number)
      } else {
        core.warning(
          `failed to get author of #${pr.number}, use git commit author name instead`,
        )
      }
    }
  }

  core.setOutput(
    'titles',
    formatPRs(prs, format, { botFormat, bots }).join('\n'),
  )
}

run().catch((err) => core.setFailed(err))
