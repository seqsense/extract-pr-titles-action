import * as core from '@actions/core'
import extractPRTitles from 'extract-pr-titles'
import simpleGit from 'simple-git'

const git = simpleGit(process.cwd())

const logOpts = {
  from: core.getInput('from'),
  to: core.getInput('to'),
  symmetric: false,
}

const extractOpts = {
  format: core.getInput('format'),
  reverse: core.getInput('reverse') == 'true',
}

const logHandler = (err, result) => {
  if (err) {
    core.setFailed(err)
    return
  }
  core.info(`${result.all.length} commits`)
  result.all.forEach(log => core.info(`- ${log.message}`))
  core.setOutput('titles', extractPRTitles(result.all, extractOpts).join('\n'))
}

git.log(logOpts, logHandler)
