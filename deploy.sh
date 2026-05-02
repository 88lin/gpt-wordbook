#!/usr/bin/env sh

# Exit on the first failure.
set -e

# Build the full release bundle.
npm run build:release

# Enter the generated output directory.
cd ./dist

# Write the custom domain record.
echo 'word.lovejade.cn' > CNAME

git init
git add -A
git commit -m '🚀 local build for deploy'

git push -f git@github.com:nicejade/gpt-wordbook.git main:gh-pages
cd -
