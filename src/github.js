const CHUNK_SIZE = 100

/**
 * Fetch the logins of the PR authors via GitHub GraphQL API.
 * git log doesn't provide the GitHub login, and the author of a merge commit is the person who merged it.
 *
 * PRs are fetched in chunks of CHUNK_SIZE per request to save the rate limit.
 * PRs not found or whose author is deleted are not included in the result.
 *
 * @param {object} opts
 * @param {string} opts.token GitHub token
 * @param {string} opts.repository owner/repo
 * @param {Array<string>} opts.numbers PR numbers
 * @param {string} [opts.graphqlUrl] GitHub GraphQL API URL
 * @returns {Promise<Map<string, string>>} map from PR number to login of the PR author
 */
export const fetchPRAuthors = async ({
  token,
  repository,
  numbers,
  graphqlUrl = 'https://api.github.com/graphql',
}) => {
  const [owner, name] = repository.split('/')
  const uniqueNumbers = [...new Set(numbers)]
  const authors = new Map()

  for (let i = 0; i < uniqueNumbers.length; i += CHUNK_SIZE) {
    const chunk = uniqueNumbers.slice(i, i + CHUNK_SIZE)
    const data = await query({
      token,
      graphqlUrl,
      query: buildQuery(chunk),
      variables: { owner, name },
    })
    for (const number of chunk) {
      const author = data.repository?.[`pr${number}`]?.author
      if (author) {
        authors.set(number, toLogin(author))
      }
    }
  }
  return authors
}

// numbers are extracted by /#(\d+)/, so they are safe to be embedded in the query
const buildQuery = (numbers) => {
  const prs = numbers
    .map(
      (n) =>
        `pr${n}: pullRequest(number: ${n}) { author { __typename login } }`,
    )
    .join('\n')
  return `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
${prs}
  }
}`
}

// GraphQL API returns bot login without "[bot]" suffix (e.g. "renovate"),
// which can be a different user. Add the suffix to match REST API.
const toLogin = (author) =>
  author.__typename === 'Bot' ? `${author.login}[bot]` : author.login

const query = async ({ token, graphqlUrl, query, variables }) => {
  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    throw new Error(
      `failed to query GitHub GraphQL API: ${res.status} ${res.statusText}`,
    )
  }
  const json = await res.json()
  // errors with data means partial failure (e.g. some PRs not found)
  if (!json.data) {
    throw new Error(
      `failed to query GitHub GraphQL API: ${JSON.stringify(json.errors)}`,
    )
  }
  return json.data
}
