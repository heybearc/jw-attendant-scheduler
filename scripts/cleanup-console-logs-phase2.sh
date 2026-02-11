#!/bin/bash
# Phase 2: More aggressive console.log cleanup
# Removes additional debug patterns while preserving essential error context

echo "🧹 Phase 2: Aggressive console.log cleanup..."

# Count before
BEFORE=$(grep -r "console\.log" pages/ src/ components/ --include="*.ts" --include="*.tsx" | wc -l)
echo "📊 Starting with $BEFORE console.log statements"

# Pattern 6: console.log('Creating', ...) - creation logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Cc]reating/d' {} \;

# Pattern 7: console.log('Updating', ...) - update logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Uu]pdating/d' {} \;

# Pattern 8: console.log('Found', ...) - search result logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Ff]ound/d' {} \;

# Pattern 9: console.log('Checking', ...) - validation logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Cc]hecking/d' {} \;

# Pattern 10: console.log('Starting', ...) - initialization logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Ss]tarting/d' {} \;

# Pattern 11: console.log('Received', ...) - data receipt logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Rr]eceived/d' {} \;

# Pattern 12: console.log('Sending', ...) - data send logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Ss]ending/d' {} \;

# Pattern 13: console.log('Processing', ...) - processing logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Pp]rocessing/d' {} \;

# Pattern 14: console.log('Validated', ...) - validation success logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Vv]alidated/d' {} \;

# Pattern 15: console.log('Result:', ...) - result logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Rr]esult:/d' {} \;

# Count after
AFTER=$(grep -r "console\.log" pages/ src/ components/ --include="*.ts" --include="*.tsx" | wc -l)
REMOVED=$((BEFORE - AFTER))

echo "✅ Phase 2 complete!"
echo "📊 Removed $REMOVED console.log statements"
echo "📊 Remaining: $AFTER console.log statements"
