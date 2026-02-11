#!/bin/bash
# Phase 3: Final cleanup of remaining debug patterns

echo "🧹 Phase 3: Final console.log cleanup..."

BEFORE=$(grep -r "console\.log" pages/ src/ components/ --include="*.ts" --include="*.tsx" | wc -l)
echo "📊 Starting with $BEFORE console.log statements"

# Pattern 16: console.log with variable inspection (common debug pattern)
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log([^,]*:.*)/d' {} \;

# Pattern 17: console.log('Success', ...) - success messages
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Ss]uccess/d' {} \;

# Pattern 18: console.log('Complete', ...) - completion messages
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Cc]omplete/d' {} \;

# Pattern 19: console.log('Deleting', ...) - deletion logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Dd]eleting/d' {} \;

# Pattern 20: console.log('Applying', ...) - application logs
find pages/ src/ components/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/console\.log.*[Aa]pplying/d' {} \;

AFTER=$(grep -r "console\.log" pages/ src/ components/ --include="*.ts" --include="*.tsx" | wc -l)
REMOVED=$((BEFORE - AFTER))

echo "✅ Phase 3 complete!"
echo "📊 Removed $REMOVED console.log statements"
echo "📊 Remaining: $AFTER console.log statements"
echo ""
echo "🎯 Total cleanup across all phases:"
echo "   Started: 341 statements"
echo "   Current: $AFTER statements"
echo "   Removed: $((341 - AFTER)) statements ($((100 * (341 - AFTER) / 341))% reduction)"
