# Archived Scripts

**Date Archived:** 2026-01-24  
**Reason:** Second audit cleanup - obsolete utilities and one-time migration scripts

---

## CSS Fixes (css-fixes/)

Scripts used to fix CSS loading and styling issues. Archived after issues were resolved.

- `fix-css-hash.sh` - Fixed CSS hash issues
- `fix-css-loading.sh` - Fixed CSS loading problems
- `rebuild-css.sh` - Utility to rebuild CSS
- `styling-diagnostic.sh` - CSS diagnostic tool

**Status:** Issues resolved, scripts no longer needed for regular operations

---

## Migrations (migrations/)

One-time database migration and data cleanup scripts. Archived after migrations completed.

- `preview-migration.sh` - Preview migration changes
- `rollback-event-details.sh` - Rollback event details migration
- `cleanup-positions.js` - Position data cleanup
- `create-position-oversight-table.sql` - Database schema migration

**Status:** Migrations complete, preserved for historical reference

---

## Deployment (deployment/)

Legacy deployment scripts superseded by PM2 and blue-green MCP workflows.

- `deploy.sh` - Simple deployment script
- `start.sh` - Application start script
- `sync-staging-to-production.sh` - Staging to production sync (obsolete with blue-green model)
- `create-safety-checkpoint.sh` - Safety checkpoint creation

**Status:** Replaced by automated blue-green deployment workflows

---

## Configs (configs/)

Obsolete or reference-only configuration files.

- `mcp.config.json.disabled` - Disabled MCP configuration
- `mcp-config-reference.json` - MCP configuration reference

**Status:** Superseded by `mcp-config-CORRECTED.json` in root

---

## Notes

These scripts are preserved for:
- Historical reference
- Understanding past issues and solutions
- Potential future troubleshooting

If you need to use any of these scripts, they can be copied back to the appropriate location.
