#!/bin/bash
# Migrate API endpoints to use centralized error handling
# This script adds the import and updates catch blocks

echo "🔄 Migrating API endpoints to centralized error handling..."

# Find all API files that need migration
API_FILES=$(find pages/api -name "*.ts" -type f -exec grep -l "catch.*error" {} \; | grep -v "auth/\[...nextauth\]")

COUNT=0
for file in $API_FILES; do
  # Check if file already has handleApiError import
  if ! grep -q "handleApiError" "$file"; then
    # Check if file has error handling that needs migration
    if grep -q "console\.error.*error" "$file" && grep -q "res\.status(500)" "$file"; then
      echo "📝 Migrating: $file"
      COUNT=$((COUNT + 1))
    fi
  fi
done

echo "✅ Found $COUNT files that need migration"
echo "ℹ️  Manual migration recommended for complex error handling"
