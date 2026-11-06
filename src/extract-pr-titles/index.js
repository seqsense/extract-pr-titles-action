import pupa from 'pupa'

const DEFAULT_FORMAT = '{title} #{number}'

/**
 * @param {Array<ListLogLine>} logLines
 * @param {boolean} reverse Reverse the order of the output
 * @returns {Array<{title: string, number: string, author: string}>}
 */
export const extractPRs = (logLines, { reverse } = {}) => {
  const result = []
  for (const line of logLines) {
    if (isMergedPRCommit(line)) {
      result.push(extractMergedPR(line))
    } else if (isSquashedPRCommit(line)) {
      result.push(extractSquashedPR(line))
    }
  }

  if (reverse) {
    result.reverse()
  }

  return result
}

/**
 * @param {Array<{title: string, number: string, author: string}>} prs
 * @param {string} format The format for PR in pupa format. Default is {title} #{number}.
 */
export const formatPRs = (prs, format) => {
  format = format || DEFAULT_FORMAT
  return prs.map((pr) => pupa(format, pr, { ignoreMissing: true }))
}

/**
 * @param {Array<ListLogLine>} logLines
 * @param {string} format The format for PR in pupa format. Default is {title} #{number}.
 * @param {boolean} reverse Reverse the order of the output
 */
const extractPRTitles = (logLines, { format, reverse } = {}) =>
  formatPRs(extractPRs(logLines, { reverse }), format)

export default extractPRTitles

const RE_PR_NUMBER = /#(\d+)/

const isMergedPRCommit = (line) => {
  return /^Merge pull request #\d+/.test(line.message)
}

const isSquashedPRCommit = (line) => {
  return / \(#\d+\)$/.test(line.message)
}

// author is the git commit author name. For merge commits, it is the person who merged the PR, not the PR author.
const extractMergedPR = (line) => {
  const title = line.body
  const number = line.message.match(RE_PR_NUMBER)[1]
  return { title, number, author: line.author_name }
}

const extractSquashedPR = (line) => {
  const title = line.message.replace(/ \(#\d+\)$/, '')
  const number = line.message.match(RE_PR_NUMBER)[1]
  return { title, number, author: line.author_name }
}
