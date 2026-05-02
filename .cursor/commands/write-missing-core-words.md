# Task: Batch Write Missing Core Word MDX Files

## Objective

Fill missing core vocabulary entries for this project by creating MDX files for words listed in `scripts/missing-core.json`.

Use the repo-local Skill at `.codex/skills/write-missing-core-words/` as the canonical workflow. Do not reinvent the process from scratch.

## Primary Inputs

- Missing-word source: `scripts/missing-core.json`
- Output directory: `src/content/docs/words/`
- House-style reference: `src/content/docs/words/better.mdx`
- Skill file: `.codex/skills/write-missing-core-words/SKILL.md`
- Skill references:
  - `.codex/skills/write-missing-core-words/references/entry-template.md`
  - `.codex/skills/write-missing-core-words/references/batch-playbook.md`

## Default Execution Plan

### 1. Select a safe batch first

Default to a small batch of 10-20 words. If the user does not specify a size, use `15`.

Run:

```bash
node .codex/skills/write-missing-core-words/scripts/next-batch.mjs \
  --limit 15 \
  --manifest /tmp/missing-core-batch.json
```

If the user asks for a later segment, use `--offset <n>` or `--from <word>`.

### 2. Read the local style before writing

Read:

- `src/content/docs/words/better.mdx`
- `.codex/skills/write-missing-core-words/SKILL.md`
- `.codex/skills/write-missing-core-words/references/entry-template.md`
- `.codex/skills/write-missing-core-words/references/batch-playbook.md`

### 3. Create one MDX file per selected word

For each selected word:

- Create `src/content/docs/words/<word>.mdx`
- Keep the filename lowercase
- Capitalize the first letter in frontmatter `title`
- Write learner-facing explanations in Chinese
- Write example sentences in English, with Chinese translations
- Prefer the most common modern meaning, not obscure senses

### 4. Validate the written batch

After writing, run:

```bash
node .codex/skills/write-missing-core-words/scripts/verify-word-batch.mjs \
  --manifest /tmp/missing-core-batch.json
```

Fix every reported issue before moving to the next batch.

### 5. Build when needed

If many files were changed, or if any shared component/config was touched, run:

```bash
pnpm build
```

## Required MDX Structure

Every generated file must follow this structure:

```mdx
---
title: Word
description: ...
sidebar:
  hidden: true
tableOfContents: false
---

import Pronunciation from "../../../components/Pronunciation.svelte";
import WordRelations from "../../../components/WordRelations.svelte"; // only when needed

### 分析词义

...

<Pronunciation word="Word" uk="[...]" us="[...]" client:only />

### 列举例句

1. "..." (...)
2. "..." (...)
3. "..." (...)

### 词根分析

...

### 词缀分析

...

### 文化背景

...

### 单词变形

...

### 记忆辅助

...

### 助记故事

"..." (...)

<WordRelations
  synonyms={["..."]}
  antonyms={["..."]}
  client:only
/>
```

## Non-Negotiable Rules

1. Do not edit `scripts/missing-core.json`; treat it as the source list only.
2. Do not overwrite unrelated user changes already present in the workspace.
3. Always import `Pronunciation`.
4. Import and render `WordRelations` only when at least one synonym or antonym exists.
5. Keep the heading order exactly the same as the template.
6. Avoid placeholders such as `Example sentence`, `需要进一步研究`, `common collocation`, `A short story using ...`, or `TODO`.
7. Prefer 2-5 synonyms and 1-4 antonyms when suitable.
8. If etymology or affix analysis is uncertain, stay conservative and factual.
9. If a file already exists for a selected word, skip it rather than overwriting it.

## Expected Final Report

After completing a batch, report:

- which words were selected
- which files were created
- whether validation passed
- whether `pnpm build` was run
- any words skipped or any risks needing follow-up

## Success Criteria

- A clean batch of new files exists in `src/content/docs/words/`
- Every file follows the required MDX structure
- Validation passes via `verify-word-batch.mjs`
- The output is useful for Chinese-speaking English learners
