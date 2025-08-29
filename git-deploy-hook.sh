#!/bin/bash
# git-deploy-hook.sh - Git post-commit hook for automatic deployments

set -e

CURRENT_BRANCH=$(git branch --show-current)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Git post-commit hook triggered"
echo "📍 Current branch: $CURRENT_BRANCH"
echo "📁 Script directory: $SCRIPT_DIR"

case "$CURRENT_BRANCH" in
    "main"|"master")
        echo "🎭 Main branch detected - deploying to staging..."
        if [[ -f "$SCRIPT_DIR/deploy-jw-attendant.sh" ]]; then
            "$SCRIPT_DIR/deploy-jw-attendant.sh" staging
        else
            echo "❌ Deployment script not found at $SCRIPT_DIR/deploy-jw-attendant.sh"
        fi
        ;;
    "production")
        echo "🚀 Production branch detected - deploying to production..."
        if [[ -f "$SCRIPT_DIR/deploy-jw-attendant.sh" ]]; then
            "$SCRIPT_DIR/deploy-jw-attendant.sh" production
        else
            echo "❌ Deployment script not found at $SCRIPT_DIR/deploy-jw-attendant.sh"
        fi
        ;;
    *)
        echo "ℹ️  Branch '$CURRENT_BRANCH' - no automatic deployment configured"
        ;;
esac
