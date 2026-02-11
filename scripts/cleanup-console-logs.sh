#!/bin/bash
# Script to systematically remove debug console.log statements
# Keeps console.error, console.warn for essential logging

echo "🧹 Starting console.log cleanup..."

# Count before
BEFORE=$(grep -r "console\.log" pages/ src/ components/ --include="*.ts" --include="*.tsx" | wc -l)
echo "📊 Found $BEFORE console.log statements before cleanup"

# Remove standalone console.log debug statements (common patterns)
# Pattern 1: console.log('Debug:', ...)
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Dd]ebug/d' {} \;

# Pattern 2: console.log('✅', ...) - success indicators
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*✅/d' {} \;

# Pattern 3: console.log('🔍', ...) - search/inspection indicators  
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*🔍/d' {} \;

# Pattern 4: console.log('Fetching', ...) - API call logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Ff]etching/d' {} \;

# Pattern 5: console.log('Loading', ...) - loading indicators
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Ll]oading/d' {} \;

# Count after
AFTER=$(grep -r "console\.log" pages/ src/ components/ --include="*.ts" --include="*.tsx" | wc -l)
REMOVED=$((BEFORE - AFTER))

echo "✅ Cleanup complete!"
echo "📊 Removed $REMOVED console.log statements"
echo "📊 Remaining: $AFTER console.log statements"
echo ""
echo "ℹ️  Remaining logs may be:"
echo "   - Essential error context"
echo "   - Complex debugging that needs manual review"
echo "   - Logs in catch blocks"
