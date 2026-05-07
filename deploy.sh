#!/usr/bin/env sh

# Exit on the first failure.
set -e

# Update word index
node scripts/update-word-index.js

# Build the full release bundle.
npm run build:release

# Cloudflare Pages auto-discovers `functions/` at the deployment root.
# Because we publish via the pre-built `gh-pages` branch (the contents of
# ./dist), we must copy the project-root `functions/` directory into ./dist
# so Pages can register the Typesense proxy at /typesense/*.
if [ -d ./functions ]; then
  rm -rf ./dist/functions
  cp -R ./functions ./dist/functions
fi

# Enter the generated output directory.
cd ./dist

# Write the custom domain record.
echo 'word.lovejade.cn' > CNAME

git init
git add -A
git commit -m '🚀 local build for deploy'

git push -f git@github.com:nicejade/gpt-wordbook.git main:gh-pages
cd -
