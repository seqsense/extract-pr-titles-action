import { describe, it, expect, vi, afterEach } from 'vitest'

import { fetchPRAuthors } from './github.js'

const response = (body, { ok = true, status = 200, statusText = 'OK' } = {}) =>
  Promise.resolve({ ok, status, statusText, json: async () => body })

describe('fetchPRAuthors', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the logins of the PR authors', async () => {
    const fetchMock = vi.fn().mockReturnValue(
      response({
        data: {
          repository: {
            pr1: { author: { __typename: 'User', login: 'octocat' } },
            pr2: { author: { __typename: 'Bot', login: 'renovate' } },
            pr3: { author: null },
          },
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const authors = await fetchPRAuthors({
      token: 'dummy',
      repository: 'owner/repo',
      numbers: ['1', '2', '3', '1'],
    })
    expect(authors).toEqual(
      new Map([
        ['1', 'octocat'],
        ['2', 'renovate[bot]'],
      ]),
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, req] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/graphql')
    expect(req.headers.Authorization).toBe('Bearer dummy')
    const body = JSON.parse(req.body)
    expect(body.variables).toEqual({ owner: 'owner', name: 'repo' })
    expect(body.query.match(/pullRequest\(/g)).toHaveLength(3)
  })

  it('splits requests into chunks', async () => {
    const fetchMock = vi.fn().mockImplementation((_, req) => {
      const numbers = [
        ...JSON.parse(req.body).query.matchAll(/pr(\d+): /g),
      ].map((m) => m[1])
      const repository = Object.fromEntries(
        numbers.map((n) => [
          `pr${n}`,
          { author: { __typename: 'User', login: `user${n}` } },
        ]),
      )
      return response({ data: { repository } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const numbers = Array.from({ length: 250 }, (_, i) => `${i + 1}`)
    const authors = await fetchPRAuthors({
      token: 'dummy',
      repository: 'owner/repo',
      numbers,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(authors.size).toBe(250)
    expect(authors.get('250')).toBe('user250')
  })

  it('skips PRs not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        response({
          data: {
            repository: {
              pr1: { author: { __typename: 'User', login: 'octocat' } },
              pr2: null,
            },
          },
          errors: [{ type: 'NOT_FOUND', path: ['repository', 'pr2'] }],
        }),
      ),
    )

    const authors = await fetchPRAuthors({
      token: 'dummy',
      repository: 'owner/repo',
      numbers: ['1', '2'],
    })
    expect(authors).toEqual(new Map([['1', 'octocat']]))
  })

  it('throws an error when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValue(
          response({}, { ok: false, status: 401, statusText: 'Unauthorized' }),
        ),
    )

    await expect(
      fetchPRAuthors({
        token: 'dummy',
        repository: 'owner/repo',
        numbers: ['1'],
      }),
    ).rejects.toThrow('failed to query GitHub GraphQL API: 401 Unauthorized')
  })

  it('throws an error when the query fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(response({ errors: [{ message: 'bad query' }] })),
    )

    await expect(
      fetchPRAuthors({
        token: 'dummy',
        repository: 'owner/repo',
        numbers: ['1'],
      }),
    ).rejects.toThrow('bad query')
  })
})
