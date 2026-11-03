# extract-pr-titles-action

GitHub Action to extract PR titles between the given two git refs.
Wrapper of https://github.com/kt3k/extract-pr-titles

```yaml
jobs:
  example:
    steps:
      - uses: actions/checkout@v2
        with:
          ref: refs/remotes/origin/main
          fetch-depth: 0
      - uses: seqsense/extract-pr-titles-action@v0
        id: titles
        with:
          from: origin/main
          to: origin/release
          format: "- {title} #{number}"
          reverse: true
      - run: echo ${{ steps.titles.outputs.titles }}
```

## Format

`format` is a [pupa](https://github.com/sindresorhus/pupa) template with the following placeholders:

- `{title}`: PR title
- `{number}`: PR number
- `{author}`: PR author
  - If `github-token` is set, it is the GitHub login of the PR author (without `@`) fetched via GitHub API.
    Bot login has `[bot]` suffix (e.g. `renovate[bot]`), so `@{author}` doesn't work as a mention for bots
    (GitHub treats `@renovate[bot]` as a mention to the user `renovate`).
  - Otherwise, it is the git commit author name.
    Note that the author of a merge commit is the person who merged the PR.

```yaml
      - uses: seqsense/extract-pr-titles-action@v0
        with:
          from: origin/main
          to: origin/release
          format: "- #{number} by {author}"
          github-token: ${{ github.token }}
```

## Licenses

- [LICENSE](https://github.com/seqsense/extract-pr-titles-action/blob/main/LICENSE)
- [src/extract-pr-titles/LICENSE](https://github.com/seqsense/extract-pr-titles-action/blob/main/src/extract-pr-titles/LICENSE)
  - `extract-pr-titles` was originally at https://github.com/kt3k/extract-pr-titles (archived)
