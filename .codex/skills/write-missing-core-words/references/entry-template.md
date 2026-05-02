# Entry Template

Use this template for each new file in `src/content/docs/words/`.

```mdx
---
title: {{TitleCaseWord}}
description: {{Short Chinese definition for the dominant sense}}
sidebar:
  hidden: true
tableOfContents: false
---

import Pronunciation from "../../../components/Pronunciation.svelte";
{{OptionalWordRelationsImport}}

### 分析词义

{{Explain the main meaning, part of speech, common usage, and learner-facing nuance in Chinese.}}

<Pronunciation word="{{TitleCaseWord}}" uk="{{UK_IPA}}" us="{{US_IPA}}" client:only />

### 列举例句

1. "{{Example sentence 1}}" ({{Chinese translation 1}})
2. "{{Example sentence 2}}" ({{Chinese translation 2}})
3. "{{Example sentence 3}}" ({{Chinese translation 3}})

### 词根分析

{{Give a factual etymology or root explanation in Chinese.}}

### 词缀分析

{{Explain prefix/suffix structure, or state that there is no obvious productive prefix/suffix.}}

### 文化背景

{{Explain cultural context, register, connotation, or where the word often appears.}}

### 单词变形

- 固定搭配: "{{Collocation 1}}" ({{Chinese gloss}}), "{{Collocation 2}}" ({{Chinese gloss}})
{{Optional inflection or derived-form bullets when genuinely useful}}

### 记忆辅助

{{Give a practical mnemonic or association in Chinese.}}

### 助记故事

"{{Short English micro-story using the word naturally.}}" ({{Chinese translation}})

{{OptionalWordRelationsComponent}}
```

## Conditional Rules

- Omit `WordRelations` import when both synonym and antonym lists are empty.
- Omit the `<WordRelations ... />` block when both lists are empty.
- Keep the section order unchanged.
- Keep comments out of the final MDX unless they are necessary for syntax.
- Prefer content that helps a learner use the word, not just recognize it.
