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
