#!/usr/bin/env node

/**
 * Script to convert event pages to use EventPageWrapper
 * This ensures consistent, error-free conversion
 */

const fs = require('fs');
const path = require('path');

function convertPage(filePath) {
  console.log(`Converting ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Step 1: Replace EventLayout import with EventPageWrapper
  content = content.replace(
    /import EventLayout from ['"]\.\.\/\.\.\/\.\.\/components\/EventLayout['"]/,
    "import EventPageWrapper from '../../../components/EventPageWrapper'"
  );
  
  // Step 2: Fix Attendant type to Volunteer (lanyards specific)
  if (filePath.includes('lanyards')) {
    content = content.replace(/attendants: Attendant\[\]/g, 'attendants: Volunteer[]');
    content = content.replace(/useState<Attendant \| null>/g, 'useState<Volunteer | null>');
  }
  
  // Step 3: Add permission props to interface
  content = content.replace(
    /(interface \w+PageProps \{[^}]+)(}\s*\n)/s,
    (match, interfaceBody, closing) => {
      if (interfaceBody.includes('canEdit')) {
        return match; // Already has permissions
      }
      return interfaceBody + 
        '  canEdit: boolean\n' +
        '  canDelete: boolean\n' +
        '  canManagePermissions: boolean\n' +
        closing;
    }
  );
  
  // Step 4: Add permission props to function signature
  content = content.replace(
    /(export default function \w+\([^)]+)(}\s*:\s*\w+PageProps\))/,
    (match, funcStart, funcEnd) => {
      if (funcStart.includes('canEdit')) {
        return match; // Already has permissions
      }
      return funcStart + ', canEdit, canDelete, canManagePermissions' + funcEnd;
    }
  );
  
  // Step 5: Replace EventLayout with EventPageWrapper in loading state
  content = content.replace(
    /<EventLayout\s+title="[^"]*"\s+breadcrumbs=\{[^}]+\}\s*>/g,
    (match) => {
      const currentPage = path.basename(filePath, '.tsx');
      return `<EventPageWrapper
        event={event}
        currentPage="${currentPage}"
        canEdit={canEdit}
        canDelete={canDelete}
        canManagePermissions={canManagePermissions}
      >`;
    }
  );
  
  // Step 6: Replace closing EventLayout tags
  content = content.replace(/<\/EventLayout>/g, '</EventPageWrapper>');
  
  // Step 7: Add permission checks to getServerSideProps
  content = content.replace(
    /(const canManage = [^\n]+\n\n)(    return \{)/,
    `$1    // Check event-specific permissions
    const { canManageEvent, canDeleteEvent, canManagePermissions } = await import('../../../src/lib/eventAccess')
    const userId = session.user?.id || ''
    const canEdit = await canManageEvent(userId, context.params!.id as string)
    const canDelete = await canDeleteEvent(userId, context.params!.id as string)
    const canManagePerms = await canManagePermissions(userId, context.params!.id as string)

$2`
  );
  
  // Step 8: Add permissions to props return
  content = content.replace(
    /(stats: \{[^}]+\})\s*(}\s*}\s*})/s,
    `$1,
        canEdit,
        canDelete,
        canManagePermissions: canManagePerms
      $2`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Converted ${filePath}`);
}

// Convert lanyards and edit pages
const lanyardsPath = path.join(__dirname, '../pages/events/[id]/lanyards.tsx');
const editPath = path.join(__dirname, '../pages/events/[id]/edit.tsx');

try {
  convertPage(lanyardsPath);
  convertPage(editPath);
  console.log('\n✅ All pages converted successfully!');
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
  process.exit(1);
}
