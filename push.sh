#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Cleaning git lock file if present..."
rm -f .git/index.lock

echo "Configuring git..."
git config user.email "jasonzzx@gmail.com"
git config user.name "Jason"

echo "Staging all files..."
git add -A

echo "Committing..."
git commit -m "feat: add service alerts – badge + modal on affected trains"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Vercel will auto-deploy from GitHub."
