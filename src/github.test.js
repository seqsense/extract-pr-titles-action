import { describe, it, expect, vi, afterEach } from 'vitest'

import { fetchPRAuthor } from './github.js'

describe('fetchPRAuthor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the login of the PR author', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { login: 'octocat' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const login = await fetchPRAuthor({
      token: 'dummy',
      repository: 'owner/repo',
      number: '123',
    })
    expect(login).toBe('octocat')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/pulls/123',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer dummy' }),
      }),
    )
  })

  it('throws an error when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    )

    await expect(
      fetchPRAuthor({ token: 'dummy', repository: 'owner/repo', number: '1' }),
    ).rejects.toThrow('failed to get PR #1 of owner/repo: 404 Not Found')
  })
})
