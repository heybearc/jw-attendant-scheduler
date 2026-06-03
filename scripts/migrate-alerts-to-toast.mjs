#!/usr/bin/env node
/**
 * One-off migration: browser alert/confirm/prompt -> toast + appConfirm/appPrompt
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const files = [
  'pages/admin/users/[id]/edit.tsx',
  'pages/events/index.tsx',
  'pages/events/[id]/positions.tsx',
  'pages/volunteer/chat.tsx',
  'hooks/useBulkOperations.ts',
  'pages/events/[id]/count-times.tsx',
  'components/BulkActionModal.tsx',
  'src/components/TemplateForm.tsx',
  'pages/admin/users/invite.tsx',
  'pages/help/feedback.tsx',
  'pages/admin/locations.tsx',
  'pages/volunteer/dashboard.tsx',
  'components/ivs/IVSApprovalsContent.tsx',
  'hooks/usePositions.ts',
  'styles/index.tsx',
  'hooks/useOversight.ts',
  'pages/events/[id]/count-times/[sessionId]/enter-count.tsx',
  'hooks/useExport.ts',
  'pages/admin/email-config/index.tsx',
  'pages/events/[id]/positions-old.tsx',
  'components/LocationSelector.tsx',
  'lib/exportService.ts',
  'pages/admin/notification-settings.tsx',
  'pages/events/[id]/lanyards.tsx',
  'pages/events/[id]/volunteers.tsx',
  'hooks/useShifts.ts',
  'pages/events/[id]/permissions.tsx',
  'pages/admin/attendant-pins.tsx',
  'pages/admin/global-announcements.tsx',
  'features/attendant-management/components/EventAttendantManagementPage.tsx',
  'components/ivs/IVSCheckinContent.tsx',
  'components/EarlyCheckinPanel.tsx',
  'pages/events/[id]/documents.tsx',
  'pages/events/[id]/chat.tsx',
  'pages/help/my-feedback.tsx',
  'hooks/useAssignments.ts',
  'pages/event-positions/[eventId].tsx',
  'components/FilterPresets.tsx',
  'pages/events/[id]/index.tsx',
  'pages/events/[id]/assignments.tsx',
  'pages/admin/feedback.tsx',
  'components/BulkPositionCreator.tsx',
  'pages/admin/users/index.tsx',
]

function libImportPath(file) {
  const depth = file.split('/').length - 1
  return `${'../'.repeat(depth)}lib/ui`
}

function ensureImports(content, file, { toast, confirm, prompt }) {
  const rel = libImportPath(file)
  const lines = []
  if (toast) lines.push(`import { notifyAlert, toast } from '${rel}/toast'`)
  else if (content.includes('toast.')) lines.push(`import { toast } from '${rel}/toast'`)
  if (confirm) lines.push(`import { appConfirm, appConfirmMessage } from '${rel}/confirm'`)
  if (prompt) lines.push(`import { appPrompt } from '${rel}/prompt'`)

  const block = lines.join('\n')
  if (!block) return content
  if (content.includes(`${rel}/toast`) || content.includes(`${rel}/confirm`)) return content

  const importMatches = [...content.matchAll(/^import .+$/gm)]
  if (importMatches.length) {
    const last = importMatches[importMatches.length - 1]
    const idx = last.index + last[0].length
    return content.slice(0, idx) + '\n' + block + content.slice(idx)
  }
  return block + '\n\n' + content
}

for (const file of files) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) {
    console.warn('skip missing', file)
    continue
  }
  let content = fs.readFileSync(full, 'utf8')
  const hadAlert = /\balert\s*\(/.test(content)
  const hadConfirm = /\bconfirm\s*\(/.test(content)
  const hadPrompt = /\bprompt\s*\(/.test(content)
  if (!hadAlert && !hadConfirm && !hadPrompt) continue

  content = ensureImports(content, file, {
    toast: hadAlert,
    confirm: hadConfirm,
    prompt: hadPrompt,
  })

  content = content.replace(/\balert\s*\(/g, 'notifyAlert(')
  content = content.replace(/if\s*\(\s*!confirm\s*\(/g, 'if (!(await appConfirmMessage(')
  content = content.replace(/if\s*\(\s*!window\.confirm\s*\(/g, 'if (!(await appConfirmMessage(')
  content = content.replace(/if\s*\(\s*confirm\s*\(/g, 'if (await appConfirmMessage(')
  content = content.replace(/const\s+(\w+)\s*=\s*confirm\s*\(/g, 'const $1 = await appConfirmMessage(')
  content = content.replace(/const\s+(\w+)\s*=\s*window\.confirm\s*\(/g, 'const $1 = await appConfirmMessage(')

  fs.writeFileSync(full, content)
  console.log('migrated', file)
}

console.log('done')
