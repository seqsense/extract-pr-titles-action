/**
 * Fetch the login of the PR author via GitHub API.
 * git log doesn't provide the GitHub login, and the author of a merge commit is the person who merged it.
 *
 * @param {object} opts
 * @param {string} opts.token GitHub token
 * @param {string} opts.repository owner/repo
 * @param {string} opts.number PR number
 * @param {string} [opts.apiUrl] GitHub API URL
 * @returns {Promise<string>} login of the PR author
 */
export const fetchPRAuthor = async ({
  token,
  repository,
  number,
  apiUrl = 'https://api.github.com',
}) => {
  const res = await fetch(`${apiUrl}/repos/${repository}/pulls/${number}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    throw new Error(
      `failed to get PR #${number} of ${repository}: ${res.status} ${res.statusText}`,
    )
  }
  const pr = await res.json()
  return pr.user.login
}
