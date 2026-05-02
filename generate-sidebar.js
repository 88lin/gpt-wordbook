import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_VERSION = 1;
const TITLE_READ_SIZE = 2048;
const wordsDir = path.resolve(__dirname, "./src/content/docs/words");
const indexDir = path.resolve(__dirname, "./src/content/docs/words-index");
const cacheDir = path.resolve(__dirname, "./.cache");
const cacheFilePath = path.join(cacheDir, "word-index-cache.json");

function ensureDirSync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function writeFileIfChanged(filePath, content) {
  const currentContent = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf-8")
    : null;

  if (currentContent === content) {
    return false;
  }

  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

function normalizeTitle(rawTitle) {
  const trimmedTitle = rawTitle.trim();

  if (
    trimmedTitle.length >= 2 &&
    ((trimmedTitle.startsWith('"') && trimmedTitle.endsWith('"')) ||
      (trimmedTitle.startsWith("'") && trimmedTitle.endsWith("'")))
  ) {
    return trimmedTitle.slice(1, -1).trim();
  }

  return trimmedTitle;
}

function getFallbackDisplayName(fileName) {
  if (!fileName) {
    return fileName;
  }

  return fileName
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("-");
}

function extractTitle(filePath, fallbackTitle) {
  const fileDescriptor = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(TITLE_READ_SIZE);

  try {
    const bytesRead = fs.readSync(fileDescriptor, buffer, 0, buffer.length, 0);
    const preview = buffer.toString("utf-8", 0, bytesRead);
    const titleMatch = preview.match(/^\s*title:\s*(.+)\s*$/m);

    if (!titleMatch) {
      return fallbackTitle;
    }

    const normalizedTitle = normalizeTitle(titleMatch[1]);
    return normalizedTitle || fallbackTitle;
  } finally {
    fs.closeSync(fileDescriptor);
  }
}

function listWordFiles() {
  if (!fs.existsSync(wordsDir)) {
    return [];
  }

  return fs
    .readdirSync(wordsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => {
      const filePath = path.join(wordsDir, entry.name);
      const stats = fs.statSync(filePath);

      return {
        fileName: entry.name.slice(0, -4),
        filePath,
        size: stats.size,
        mtimeMs: Math.trunc(stats.mtimeMs),
      };
    })
    .sort((left, right) =>
      left.fileName.localeCompare(right.fileName, "en", { sensitivity: "base" })
    );
}

function compareLetters(left, right) {
  if (left === "#" && right === "#") {
    return 0;
  }

  if (left === "#") {
    return 1;
  }

  if (right === "#") {
    return -1;
  }

  return left.localeCompare(right, "en", { sensitivity: "base" });
}

function buildGroupedWords(wordFiles, verbose = false) {
  const groupedWords = {};

  for (const wordFile of wordFiles) {
    const fallbackTitle = getFallbackDisplayName(wordFile.fileName);
    const displayName = extractTitle(wordFile.filePath, fallbackTitle);
    const leadingCharacter = displayName.charAt(0).toUpperCase();
    const groupKey = /^[A-Z]$/.test(leadingCharacter) ? leadingCharacter : "#";

    if (!groupedWords[groupKey]) {
      groupedWords[groupKey] = [];
    }

    groupedWords[groupKey].push({
      fileName: wordFile.fileName,
      displayName,
    });
  }

  if (verbose) {
    console.log(
      `Indexed ${wordFiles.length} word files into ${
        Object.keys(groupedWords).length
      } groups.`
    );
  }

  return groupedWords;
}

function generateSidebarConfigFromGroups(groupedWords) {
  const letters = Object.keys(groupedWords).sort(compareLetters);

  return [
    {
      label: "📖 单词索引",
      items: letters.map((letter) => {
        const label = letter === "#" ? "符号/数字" : letter;

        return {
          label: `${label} (${groupedWords[letter].length} 词)`,
          link: `/words-index/${
            letter === "#" ? "special" : letter.toLowerCase()
          }/`,
        };
      }),
    },
  ];
}

function getIndexLabel(letter) {
  return letter === "#" ? "符号/数字" : letter;
}

function getIndexDescription(letter, count) {
  return `${getIndexLabel(letter)} 开头的所有单词列表（共 ${count} 个）`;
}

function getIndexFileName(letter) {
  return letter === "#" ? "special" : letter.toLowerCase();
}

function renderIndexPage(letter, words) {
  const label = getIndexLabel(letter);
  const description = getIndexDescription(letter, words.length);
  const order = letter === "#" ? 999 : letter.charCodeAt(0);
  const wordLinks = words
    .map((word) => `- [${word.displayName}](/words/${word.fileName}/)`)
    .join("\n");

  return `---
title: ${label} - 单词索引
description: ${description}
tableOfContents: false
sidebar:
  hidden: false
  order: ${order}
---

import { Card, CardGrid } from "@astrojs/starlight/components";
import AlphabetIndex from "../../../components/AlphabetIndex.astro";

## ${label} 开头的单词

共收录 **${words.length}** 个单词

<div id="word-index" class="columns-2 md:columns-3 lg:columns-5 gap-6 mt-8">

${wordLinks}

</div>

---

<AlphabetIndex />
`;
}

function getExpectedIndexFiles(groupedWords) {
  return Object.keys(groupedWords)
    .sort(compareLetters)
    .map((letter) => `${getIndexFileName(letter)}.mdx`);
}

function syncIndexPages(groupedWords, verbose = false) {
  ensureDirSync(indexDir);

  const expectedIndexFiles = new Set(getExpectedIndexFiles(groupedWords));
  const existingIndexFiles = fs
    .readdirSync(indexDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name);

  for (const existingIndexFile of existingIndexFiles) {
    if (!expectedIndexFiles.has(existingIndexFile)) {
      fs.unlinkSync(path.join(indexDir, existingIndexFile));

      if (verbose) {
        console.log(`Removed stale index page: ${existingIndexFile}`);
      }
    }
  }

  for (const letter of Object.keys(groupedWords).sort(compareLetters)) {
    const fileName = `${getIndexFileName(letter)}.mdx`;
    const filePath = path.join(indexDir, fileName);
    const didWrite = writeFileIfChanged(
      filePath,
      renderIndexPage(letter, groupedWords[letter])
    );

    if (verbose && didWrite) {
      console.log(`Updated index page: ${fileName}`);
    }
  }
}

function isCacheFresh(cache, wordFiles) {
  if (
    !cache ||
    cache.version !== CACHE_VERSION ||
    !Array.isArray(cache.wordFiles)
  ) {
    return false;
  }

  if (cache.wordFiles.length !== wordFiles.length) {
    return false;
  }

  return wordFiles.every((wordFile, index) => {
    const cachedFile = cache.wordFiles[index];

    return (
      cachedFile &&
      cachedFile.fileName === wordFile.fileName &&
      cachedFile.size === wordFile.size &&
      cachedFile.mtimeMs === wordFile.mtimeMs
    );
  });
}

function hasAllIndexPages(indexFiles) {
  if (!Array.isArray(indexFiles) || indexFiles.length === 0) {
    return false;
  }

  return indexFiles.every((indexFile) =>
    fs.existsSync(path.join(indexDir, indexFile))
  );
}

function writeCache(cachePayload) {
  ensureDirSync(cacheDir);
  fs.writeFileSync(
    cacheFilePath,
    `${JSON.stringify(cachePayload, null, 2)}\n`,
    "utf-8"
  );
}

function buildArtifacts(wordFiles, verbose = false) {
  const groupedWords = buildGroupedWords(wordFiles, verbose);
  const sidebarConfig = generateSidebarConfigFromGroups(groupedWords);
  const indexFiles = getExpectedIndexFiles(groupedWords);

  syncIndexPages(groupedWords, verbose);

  const cachePayload = {
    version: CACHE_VERSION,
    generatedAt: new Date().toISOString(),
    wordFiles: wordFiles.map(({ fileName, size, mtimeMs }) => ({
      fileName,
      size,
      mtimeMs,
    })),
    groupedWords,
    sidebarConfig,
    indexFiles,
  };

  writeCache(cachePayload);
  return cachePayload;
}

function ensureWordIndexArtifacts(options = {}) {
  const { verbose = false } = options;

  if (!fs.existsSync(wordsDir)) {
    if (verbose) {
      console.error(`Word directory not found: ${wordsDir}`);
    }

    return {
      version: CACHE_VERSION,
      generatedAt: new Date().toISOString(),
      wordFiles: [],
      groupedWords: {},
      sidebarConfig: [],
      indexFiles: [],
    };
  }

  const wordFiles = listWordFiles();
  const cachedPayload = readJsonFile(cacheFilePath);

  if (
    isCacheFresh(cachedPayload, wordFiles) &&
    hasAllIndexPages(cachedPayload.indexFiles)
  ) {
    if (verbose) {
      console.log(
        `Word index cache is fresh for ${wordFiles.length} files. Skipping regeneration.`
      );
    }

    return cachedPayload;
  }

  if (verbose) {
    console.log(
      `Rebuilding word index artifacts for ${wordFiles.length} files...`
    );
  }

  return buildArtifacts(wordFiles, verbose);
}

function loadSidebarConfig() {
  const cachedPayload = readJsonFile(cacheFilePath);

  if (
    cachedPayload?.version === CACHE_VERSION &&
    Array.isArray(cachedPayload.sidebarConfig) &&
    hasAllIndexPages(cachedPayload.indexFiles)
  ) {
    return cachedPayload.sidebarConfig;
  }

  return ensureWordIndexArtifacts().sidebarConfig;
}

function getGroupedWords(verbose = false) {
  return ensureWordIndexArtifacts({ verbose }).groupedWords;
}

function generateIndexPages(verbose = false) {
  ensureWordIndexArtifacts({ verbose });
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  ensureWordIndexArtifacts({ verbose: true });
}

const sidebarConfig = loadSidebarConfig();

export default sidebarConfig;
export { ensureWordIndexArtifacts, generateIndexPages, getGroupedWords };
