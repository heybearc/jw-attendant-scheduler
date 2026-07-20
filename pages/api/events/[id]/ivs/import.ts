import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import formidable, { File } from 'formidable'
import ExcelJS from 'exceljs'
import { v4 as uuidv4 } from 'uuid'
import { canManageIvsVolunteers } from '@/lib/eventAccess'
import { isValidIvsApprovalStatus, ivsPlaceholderEmail, type IvsApprovalStatus } from '@/lib/ivs'
import { findOrCreateVolunteer } from '@/lib/volunteerHelpers'
import {
  EarlyEntrySchedule,
  hasAnyEarlyEligibility,
  parseEarlyEntryDaysInput,
  scheduleToPrismaUpdate,
} from '@/lib/ivsEarlyCheckin'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface ImportedVolunteer {
  name: string
  congregation: string
  department?: string
  status?: IvsApprovalStatus
  earlyEntry?: EarlyEntrySchedule
}

interface ImportResult {
  success: boolean
  batchId?: string
  volunteerCount?: number
  imported?: number
  updated?: number
  skipped?: number
  errors?: string[]
  message?: string
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function cellString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text: unknown }).text ?? '').trim()
  }
  return String(value).trim()
}

function parseYesNo(raw: string | undefined): boolean | null {
  if (raw == null || !raw.trim()) return null
  const n = raw.trim().toLowerCase()
  if (['y', 'yes', 'true', '1', 'x'].includes(n)) return true
  if (['n', 'no', 'false', '0'].includes(n)) return false
  return null
}

function parseStatus(raw: string | undefined): IvsApprovalStatus | undefined {
  if (!raw?.trim()) return undefined
  const trimmed = raw.trim()
  if (isValidIvsApprovalStatus(trimmed)) return trimmed
  const title = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  if (isValidIvsApprovalStatus(title)) return title
  // Common aliases
  const aliases: Record<string, IvsApprovalStatus> = {
    approved: 'Approved',
    pending: 'Pending',
    requested: 'Requested',
    'not approved': 'Not Approved',
    rejected: 'Not Approved',
    denied: 'Not Approved',
  }
  return aliases[trimmed.toLowerCase()]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID required' })
    }

    if (!(await canManageIvsVolunteers(session.user.id, eventId))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage IVS volunteers for this event',
      })
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const requestRound = fields.requestRound ? parseInt(fields.requestRound[0], 10) : 1
    const departmentName = fields.departmentName ? fields.departmentName[0] : undefined

    const volunteers = await parseVolunteerFile(file)
    console.log(`[IVS Import] Parsed ${volunteers.length} volunteers from file`)

    if (volunteers.length === 0) {
      return res.status(400).json({ success: false, message: 'No volunteers found in file' })
    }

    const batchId = uuidv4()
    await prisma.ivs_import_batches.create({
      data: {
        id: batchId,
        eventId,
        requestRound,
        importedBy: session.user.id,
        fileName: file.originalFilename || 'unknown',
        departmentName,
        volunteerCount: volunteers.length,
        notes: `Imported ${volunteers.length} volunteers`,
      },
    })

    let imported = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const volunteer of volunteers) {
      try {
        const { firstName, lastName } = parseName(volunteer.name)
        const placeholderEmail = ivsPlaceholderEmail(firstName, lastName)
        const rowDepartment = volunteer.department?.trim() || departmentName || undefined

        const existing = await prisma.event_volunteers.findFirst({
          where: {
            eventId,
            OR: [
              {
                volunteer: {
                  email: { equals: placeholderEmail, mode: 'insensitive' },
                },
              },
              {
                volunteer: {
                  firstName: { equals: firstName, mode: 'insensitive' },
                  lastName: { equals: lastName, mode: 'insensitive' },
                  congregation: { equals: volunteer.congregation, mode: 'insensitive' },
                },
              },
            ],
          },
        })

        const formsOfServiceLookup = async () => {
          const globalVolunteer = await findOrCreateVolunteer({
            firstName,
            lastName,
            email: placeholderEmail,
            congregation: volunteer.congregation,
          })
          return globalVolunteer
        }

        if (existing) {
          const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
            ivsRequestRound: requestRound,
            ivsImportBatchId: existing.ivsImportBatchId || batchId,
          }

          if (rowDepartment) {
            updateData.ivsSubmittedBy = rowDepartment
          }

          if (volunteer.status) {
            updateData.ivsApprovalStatus = volunteer.status
            if (volunteer.status === 'Approved') {
              updateData.ivsApprovedAt = existing.ivsApprovedAt || new Date()
              updateData.ivsApprovedBy =
                existing.ivsApprovedBy || session.user.email || session.user.id
            }
          }

          if (volunteer.earlyEntry) {
            Object.assign(updateData, scheduleToPrismaUpdate(volunteer.earlyEntry))
          }

          await prisma.event_volunteers.update({
            where: { id: existing.id },
            data: updateData,
          })

          if (volunteer.congregation && existing.volunteerId) {
            await prisma.volunteers.update({
              where: { id: existing.volunteerId },
              data: { congregation: volunteer.congregation },
            })
          }

          updated++
          continue
        }

        const globalVolunteer = await formsOfServiceLookup()
        const formsOfService = globalVolunteer.formsOfService as string[] | null
        const isElder = formsOfService?.includes('Elder') || false

        let approvalStatus: IvsApprovalStatus =
          volunteer.status || (isElder ? 'Approved' : 'Pending')
        let approvedAt: Date | undefined
        let approvedBy: string | undefined

        if (approvalStatus === 'Approved') {
          approvedAt = new Date()
          approvedBy = volunteer.status
            ? session.user.email || session.user.id
            : 'Auto-approved (Elder)'
        }

        const early = volunteer.earlyEntry
        const earlyCreate = early
          ? {
              earlyCheckinFriday: early.friday,
              earlyCheckinSaturday: early.saturday,
              earlyCheckinSunday: early.sunday,
              earlyCheckinEligible: hasAnyEarlyEligibility(early),
            }
          : {}

        await prisma.event_volunteers.create({
          data: {
            id: uuidv4(),
            eventId,
            volunteerId: globalVolunteer.id,
            userId: null,
            role: 'VOLUNTEER' as any,
            isActive: true,
            ivsApprovalStatus: approvalStatus,
            ivsSubmittedBy: rowDepartment,
            ivsRequestRound: requestRound,
            ivsImportBatchId: batchId,
            ivsApprovedAt: approvedAt,
            ivsApprovedBy: approvedBy,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...earlyCreate,
          },
        })

        imported++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`Error importing ${volunteer.name}: ${message}`)
        skipped++
      }
    }

    await prisma.ivs_import_batches.update({
      where: { id: batchId },
      data: {
        volunteerCount: imported + updated,
        notes: `Imported ${imported}, updated ${updated}, errors ${errors.length}`,
      },
    })

    return res.status(200).json({
      success: true,
      batchId,
      volunteerCount: volunteers.length,
      imported,
      updated,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return res.status(500).json({
      success: false,
      message,
    })
  }
}

async function parseVolunteerFile(file: File): Promise<ImportedVolunteer[]> {
  const workbook = new ExcelJS.Workbook()
  const lowerName = (file.originalFilename || '').toLowerCase()

  if (lowerName.endsWith('.csv')) {
    await workbook.csv.readFile(file.filepath)
  } else {
    await workbook.xlsx.readFile(file.filepath)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error('File is empty')
  }

  const headerRow = worksheet.getRow(1)
  const headerMap = new Map<string, number>()
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeader(cellString(cell.value))
    if (key) headerMap.set(key, colNumber)
  })

  const nameCol = headerMap.get('NAME')
  const congregationCol = headerMap.get('CONGREGATION')

  if (!nameCol || !congregationCol) {
    const found = [...headerMap.keys()].join(', ') || '(none)'
    throw new Error(
      `Invalid spreadsheet format. Required columns: NAME, CONGREGATION. Optional: DEPARTMENT, STATUS, EARLY ENTRY. Found: ${found}`,
    )
  }

  const deptCol =
    headerMap.get('DEPARTMENT') ||
    headerMap.get('SUBMITTED BY') ||
    headerMap.get('DEPT')
  const statusCol =
    headerMap.get('STATUS') ||
    headerMap.get('APPROVAL STATUS') ||
    headerMap.get('IVS STATUS')
  const earlyCol =
    headerMap.get('EARLY ENTRY') ||
    headerMap.get('EARLY ENTRY DAYS') ||
    headerMap.get('EARLY ENTRY STATUS') ||
    headerMap.get('EARLY CHECK IN') ||
    headerMap.get('EARLY CHECKIN')
  const friCol =
    headerMap.get('EARLY ENTRY FRIDAY') ||
    headerMap.get('FRIDAY EARLY ENTRY') ||
    headerMap.get('EARLY FRIDAY')
  const satCol =
    headerMap.get('EARLY ENTRY SATURDAY') ||
    headerMap.get('SATURDAY EARLY ENTRY') ||
    headerMap.get('EARLY SATURDAY')
  const sunCol =
    headerMap.get('EARLY ENTRY SUNDAY') ||
    headerMap.get('SUNDAY EARLY ENTRY') ||
    headerMap.get('EARLY SUNDAY')

  const volunteers: ImportedVolunteer[] = []

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const name = cellString(row.getCell(nameCol).value)
    const congregation = cellString(row.getCell(congregationCol).value)
    if (!name || !congregation) return

    const department = deptCol ? cellString(row.getCell(deptCol).value) || undefined : undefined
    const statusRaw = statusCol ? cellString(row.getCell(statusCol).value) : undefined
    const status = parseStatus(statusRaw)
    // Invalid status values are ignored for that field (row still imports)

    let earlyEntry: EarlyEntrySchedule | undefined

    if (earlyCol) {
      const parsed = parseEarlyEntryDaysInput(cellString(row.getCell(earlyCol).value))
      if (parsed) earlyEntry = parsed
    }

    if (friCol || satCol || sunCol) {
      const schedule: EarlyEntrySchedule = earlyEntry || {
        friday: false,
        saturday: false,
        sunday: false,
      }
      if (friCol) {
        const v = parseYesNo(cellString(row.getCell(friCol).value))
        if (v !== null) schedule.friday = v
      }
      if (satCol) {
        const v = parseYesNo(cellString(row.getCell(satCol).value))
        if (v !== null) schedule.saturday = v
      }
      if (sunCol) {
        const v = parseYesNo(cellString(row.getCell(sunCol).value))
        if (v !== null) schedule.sunday = v
      }
      earlyEntry = schedule
    }

    // Empty early-entry column that parsed as all-false from blank is fine; preserve if any day set or explicit "no"
    if (earlyEntry && !hasAnyEarlyEligibility(earlyEntry) && !earlyCol && !(friCol || satCol || sunCol)) {
      earlyEntry = undefined
    }

    volunteers.push({
      name,
      congregation,
      department,
      status,
      earlyEntry,
    })
  })

  return volunteers
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  const lastName = parts[parts.length - 1]
  const firstName = parts.slice(0, -1).join(' ')

  return { firstName, lastName }
}
