#!/bin/bash
# Pre-commit hook for security checks
# Install: cp .github/workflows/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Running pre-commit security checks..."

# Check for .env files
if git diff --cached --name-only | grep -E '^\\.env(\\..*)?$'; then
  echo '❌ ERROR: Attempting to commit .env file!'
  echo 'Remove it with: git reset HEAD .env*'
  exit 1
fi

# Check for common secret patterns
FILES=$(git diff --cached --name-only --diff-filter=ACM)
for FILE in $FILES; do
  # Check for potential secrets
  if git diff --cached "$FILE" | grep -qE '(AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9_]{36}|xoxb-|sk-[a-zA-Z0-9]{32,}|AIzaSy[A-Za-z0-9_-]{33})'; then
    echo "⚠️  WARNING: Potential secret detected in $FILE"
    echo "Please review the changes carefully!"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
done

# Check for console.log with potentially sensitive data
if git diff --cached | grep -qE 'console\.(log|error|warn).*\$\{.*TOKEN'; then
  echo "⚠️  WARNING: console.log with potential token/secret detected"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo '✅ Pre-commit checks passed!'
exit 0

