/**
 * One-time (idempotent) normalize of phone numbers across TheoShift tables.
 * Run: node -r dotenv/config scripts/normalize-all-phones.js
 * Or from app root with DATABASE_URL set.
 */
const { PrismaClient } = require('@prisma/client')

function formatPhoneNumber(value) {
  if (!value) return ''
  let numbers = String(value).replace(/\D/g, '')
  if (numbers.length === 11 && numbers.startsWith('1')) numbers = numbers.slice(1)
  if (numbers.length > 10 && numbers.startsWith('1')) numbers = numbers.slice(1, 11)
  else if (numbers.length > 10) numbers = numbers.slice(0, 10)
  if (numbers.length === 0) return ''
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
}

function normalizePhoneOrNull(value) {
  const n = formatPhoneNumber(value)
  return n || null
}

function normalizeContactList(value) {
  if (!Array.isArray(value)) return value
  return value.map((item) => {
    if (!item || typeof item !== 'object') return item
    if (!item.phone) return item
    return { ...item, phone: formatPhoneNumber(item.phone) }
  })
}

function normalizeIvsContacts(settings) {
  if (!settings || typeof settings !== 'object') return { settings, changed: false }
  const contacts = settings.ivsDepartmentContacts
  if (!contacts || typeof contacts !== 'object') return { settings, changed: false }
  let changed = false
  const next = {}
  for (const [dept, entry] of Object.entries(contacts)) {
    if (!entry || typeof entry !== 'object') {
      next[dept] = entry
      continue
    }
    const overseerPhone = entry.overseerPhone
      ? formatPhoneNumber(entry.overseerPhone)
      : entry.overseerPhone
    const assistants = Array.isArray(entry.assistants)
      ? entry.assistants.map((a) =>
          a && a.phone ? { ...a, phone: formatPhoneNumber(a.phone) } : a,
        )
      : entry.assistants
    if (overseerPhone !== entry.overseerPhone) changed = true
    if (JSON.stringify(assistants) !== JSON.stringify(entry.assistants)) changed = true
    next[dept] = { ...entry, overseerPhone, assistants }
  }
  if (!changed) return { settings, changed: false }
  return { settings: { ...settings, ivsDepartmentContacts: next }, changed: true }
}

async function main() {
  const prisma = new PrismaClient()
  let volunteersUpdated = 0
  let usersUpdated = 0
  let eventsUpdated = 0

  try {
    const volunteers = await prisma.volunteers.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    })
    for (const v of volunteers) {
      const next = normalizePhoneOrNull(v.phone)
      if (next && next !== v.phone) {
        await prisma.volunteers.update({ where: { id: v.id }, data: { phone: next } })
        volunteersUpdated++
      }
    }

    const users = await prisma.users.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    })
    for (const u of users) {
      const next = normalizePhoneOrNull(u.phone)
      if (next && next !== u.phone) {
        await prisma.users.update({ where: { id: u.id }, data: { phone: next } })
        usersUpdated++
      }
    }

    const events = await prisma.events.findMany({
      select: {
        id: true,
        departmentOverseerPhone: true,
        departmentOverseerAssistants: true,
        keyman: true,
        settings: true,
      },
    })
    for (const e of events) {
      const data = {}
      const phone = e.departmentOverseerPhone
        ? normalizePhoneOrNull(e.departmentOverseerPhone)
        : e.departmentOverseerPhone
      if (phone !== e.departmentOverseerPhone) data.departmentOverseerPhone = phone

      const assistants = normalizeContactList(e.departmentOverseerAssistants)
      if (JSON.stringify(assistants) !== JSON.stringify(e.departmentOverseerAssistants)) {
        data.departmentOverseerAssistants = assistants
      }

      const keyman = normalizeContactList(e.keyman)
      if (JSON.stringify(keyman) !== JSON.stringify(e.keyman)) data.keyman = keyman

      const { settings, changed } = normalizeIvsContacts(e.settings)
      if (changed) data.settings = settings

      if (Object.keys(data).length > 0) {
        await prisma.events.update({ where: { id: e.id }, data })
        eventsUpdated++
      }
    }

    console.log(
      JSON.stringify({
        ok: true,
        volunteersUpdated,
        usersUpdated,
        eventsUpdated,
      }),
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
