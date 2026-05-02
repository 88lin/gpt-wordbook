---
name: write-missing-core-words
description: Batch author missing vocabulary MDX files for the gpt-wordbook project. Use when Codex needs to fill entries listed in scripts/missing-core.json, create or revise src/content/docs/words/*.mdx in the house style, plan safe writing batches, or verify that generated word pages match the required structure.
---

# Write Missing Core Words

Use this skill to add missing core vocabulary pages without re-discovering the workflow every time.

## Quick Start

1. Select the next batch:

```bash
node .codex/skills/write-missing-core-words/scripts/next-batch.mjs --limit 15
```

2. If you want a reusable manifest for the batch, write one:

```bash
node .codex/skills/write-missing-core-words/scripts/next-batch.mjs \
  --limit 15 \
  --manifest /tmp/missing-core-batch.json
```

3. Read the style references before writing:
   - `src/content/docs/words/better.mdx`
   - [references/entry-template.md](references/entry-template.md)
   - [references/batch-playbook.md](references/batch-playbook.md)

4. Create one MDX file per selected word under `src/content/docs/words/`.

5. Validate the batch:

```bash
node .codex/skills/write-missing-core-words/scripts/verify-word-batch.mjs \
  --manifest /tmp/missing-core-batch.json
```

## Workflow

### 1. Plan a small batch

- Default to 10-20 words per batch.
- Go above 20 only when the user explicitly prioritizes throughput over reviewability.
- Do not edit `scripts/missing-core.json`; treat it as the source of truth.
- Do not overwrite unrelated user changes in the workspace.

### 2. Author files in the project format

For each selected word:

- Create `src/content/docs/words/<word>.mdx`.
- Keep the filename lowercase.
- Capitalize the first letter in frontmatter `title`.
- Keep this frontmatter shape:

```yaml
---
title: Word
description: ...
sidebar:
  hidden: true
tableOfContents: false
---
```

- Always import `Pronunciation` from `../../../components/Pronunciation.svelte`.
- Import `WordRelations` only when at least one synonym or antonym is present.
- Keep section order exactly as shown in [references/entry-template.md](references/entry-template.md).
- Write explanations in Chinese.
- Keep example sentences in English and translations in Chinese.
- Prefer natural, high-frequency meanings and collocations over rare senses.
- Prefer conservative etymology. If a root story is uncertain, stay factual and avoid speculative pseudo-analysis.

### 3. Follow content guardrails

- Avoid placeholders such as `Example sentence`, `需要进一步研究`, `common collocation`, or `A short story using ...`.
- Avoid empty `WordRelations` arrays. Omit the component instead.
- Prefer 2-5 synonyms and 1-4 antonyms, using simple lemma forms when possible.
- Keep the page helpful for learners: concrete usage, concise explanations, practical collocations, memorable examples.
- Prefer relation words that are likely to have entries in this repo, but do not block on perfect coverage.

### 4. Validate immediately after writing

- Run `verify-word-batch.mjs` on the exact batch you created.
- Fix structure issues before moving to the next batch.
- If you changed many files or touched shared components, run `pnpm build`.

## Helper Scripts

### `scripts/next-batch.mjs`

Use this script to compute the next writable batch from `scripts/missing-core.json`.

Supported flags:

- `--limit <n>`: number of words to select, default `20`
- `--offset <n>`: skip this many remaining words before selecting
- `--from <word>`: start from a specific remaining word
- `--manifest <path>`: write the selection to a JSON manifest
- `--json`: print machine-readable JSON

### `scripts/verify-word-batch.mjs`

Use this script to validate newly created files.

Supported flags:

- `--words word1,word2`: validate an explicit word list
- `--manifest <path>`: validate the `selectedWords` from a manifest

The validator checks:

- file existence
- required frontmatter fields
- required headings in order
- `Pronunciation` import and component usage
- `WordRelations` import/component consistency
- at least three numbered examples
- common placeholder text that should be replaced

## Recovery Pattern

- If validation fails, fix the files first instead of continuing with the next batch.
- If a word already exists by the time you start writing, skip it and continue.
- If a word is hard to analyze confidently, write a simpler but accurate learner-friendly entry instead of forcing a speculative deep dive.
