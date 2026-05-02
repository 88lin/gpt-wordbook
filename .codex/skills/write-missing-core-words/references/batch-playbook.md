# Batch Playbook

## Batch Size

- Default to 10-20 words.
- Use 20-30 only when the user explicitly asks for a higher-throughput pass.

## Word Selection

- Pull candidates from `scripts/missing-core.json`.
- Skip any word whose file already exists in `src/content/docs/words/`.
- Treat the source file as read-only progress input. Do not delete words from it.

## Writing Heuristics

- Write for Chinese-speaking English learners.
- Cover the most common modern sense first.
- Use examples that sound natural in everyday English.
- Keep the tone educational and concrete, not dictionary-stiff.
- Use cautious etymology and affix analysis. Do not invent roots just to fill the section.
- Prefer collocations that learners are likely to meet again.
- Keep memory aids vivid but not childish or misleading.
- Use single-word synonyms and antonyms when possible.

## Quality Checklist

- The file is named `<word>.mdx` in lowercase.
- The frontmatter includes `title`, `description`, `sidebar.hidden: true`, and `tableOfContents: false`.
- `Pronunciation` is imported and rendered once.
- `WordRelations` appears only when at least one relation exists.
- The headings are exactly:
  - `### 分析词义`
  - `### 列举例句`
  - `### 词根分析`
  - `### 词缀分析`
  - `### 文化背景`
  - `### 单词变形`
  - `### 记忆辅助`
  - `### 助记故事`
- The examples section contains at least three numbered examples.
- No placeholder phrases remain.

## Recommended Loop

1. Select the next batch with `next-batch.mjs`.
2. Open `src/content/docs/words/better.mdx` for local style calibration.
3. Write all files for the batch.
4. Run `verify-word-batch.mjs`.
5. Fix failures before starting the next batch.
