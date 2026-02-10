import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import formidable, { File } from 'formidable'
import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export const config = {
  api: {
    bodyParser: false,
  },
}

interface ImportedVolunteer {
  name: string
  congregation: string
  firstName?: string
  lastName?: string
}

interface ImportResult {
  success: boolean
  batchId?: string
  volunteerCount?: number
  imported?: number
  skipped?: number
  errors?: string[]
  message?: string
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

    // Verify user has admin access to this event
    const eventPermission = await prisma.event_permissions.findFirst({
      where: {
        eventId: eventId as string,
        userId: session.user.id,
        role: 'ADMIN' as any,
      },
    })

    if (!eventPermission) {
      return res.status(403).json({ success: false, message: 'Forbidden - Admin access required' })
    }

    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const requestRound = fields.requestRound ? parseInt(fields.requestRound[0]) : 1
    const departmentName = fields.departmentName ? fields.departmentName[0] : undefined

    // Parse Excel/CSV file
    const volunteers = await parseVolunteerFile(file)
    console.log(`[IVS Import] Parsed ${volunteers.length} volunteers from file`)
    console.log('[IVS Import] First volunteer:', volunteers[0])

    if (volunteers.length === 0) {
      return res.status(400).json({ success: false, message: 'No volunteers found in file' })
    }

    // Create import batch
    const batchId = uuidv4()
    const batch = await prisma.ivs_import_batches.create({
      data: {
        id: batchId,
        eventId: eventId as string,
        requestRound,
        importedBy: session.user.id,
        fileName: file.originalFilename || 'unknown',
        departmentName,
        volunteerCount: volunteers.length,
        notes: `Imported ${volunteers.length} volunteers`,
      },
    })

    // Import volunteers
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const volunteer of volunteers) {
      try {
        console.log(`[IVS Import] Processing volunteer: ${volunteer.name}`)
        
        // Parse name into first and last
        const { firstName, lastName } = parseName(volunteer.name)
        console.log(`[IVS Import] Parsed name - First: ${firstName}, Last: ${lastName}`)

        // Check for duplicates in this event
        const existing = await prisma.event_volunteers.findFirst({
          where: {
            eventId: eventId as string,
            volunteer: {
              firstName,
              lastName,
              congregation: volunteer.congregation,
            },
          },
        })

        if (existing) {
          console.log(`[IVS Import] Skipping duplicate: ${volunteer.name}`)
          skipped++
          continue
        }
        
        console.log(`[IVS Import] Creating volunteer record for: ${volunteer.name}`)

        // Create global volunteer record if doesn't exist
        let globalVolunteer = await prisma.volunteers.findFirst({
          where: {
            firstName,
            lastName,
            congregation: volunteer.congregation,
          },
        })

        if (!globalVolunteer) {
          globalVolunteer = await prisma.volunteers.create({
            data: {
              id: uuidv4(),
              firstName,
              lastName,
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@temp.local`,
              congregation: volunteer.congregation,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
        }

        // Check if volunteer is an elder (auto-approve)
        const formsOfService = globalVolunteer.formsOfService as string[] | null
        const isElder = formsOfService?.includes('Elder') || false
        const approvalStatus = isElder ? 'Approved' : 'Pending'
        const approvedAt = isElder ? new Date() : undefined
        const approvedBy = isElder ? 'Auto-approved (Elder)' : undefined

        // Create event volunteer record with IVS fields
        // Note: No role or userId - IVS volunteers don't have app permissions
        await prisma.event_volunteers.create({
          data: {
            id: uuidv4(),
            eventId: eventId as string,
            volunteerId: globalVolunteer.id,
            userId: null,
            isActive: true,
            ivsApprovalStatus: approvalStatus,
            ivsSubmittedBy: departmentName,
            ivsRequestRound: requestRound,
            ivsImportBatchId: batchId,
            ivsApprovedAt: approvedAt,
            ivsApprovedBy: approvedBy,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

        imported++
        console.log(`[IVS Import] Successfully imported: ${volunteer.name}`)
      } catch (error) {
        console.error(`[IVS Import] Error importing ${volunteer.name}:`, error)
        errors.push(`Error importing ${volunteer.name}: ${error.message}`)
      }
    }
    
    console.log(`[IVS Import] Import complete - Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors.length}`)

    // Update batch with final counts
    await prisma.ivs_import_batches.update({
      where: { id: batchId },
      data: {
        volunteerCount: imported,
        notes: `Imported ${imported} volunteers, skipped ${skipped} duplicates`,
      },
    })

    return res.status(200).json({
      success: true,
      batchId,
      volunteerCount: volunteers.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('IVS import error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function parseVolunteerFile(file: File): Promise<ImportedVolunteer[]> {
  const workbook = XLSX.readFile(file.filepath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

  if (data.length === 0) {
    throw new Error('File is empty')
  }

  // Validate header row
  const headerRow = data[0]
  if (!headerRow || headerRow.length < 2) {
    throw new Error('Invalid spreadsheet format. Expected columns: NAME, CONGREGATION')
  }

  const nameHeader = headerRow[0]?.toString().trim().toUpperCase()
  const congregationHeader = headerRow[1]?.toString().trim().toUpperCase()

  if (nameHeader !== 'NAME' || congregationHeader !== 'CONGREGATION') {
    throw new Error(`Invalid spreadsheet format. Expected columns: NAME, CONGREGATION. Found: ${headerRow[0]}, ${headerRow[1]}`)
  }

  const volunteers: ImportedVolunteer[] = []

  // Parse data rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 2) continue

    const name = row[0]?.toString().trim()
    const congregation = row[1]?.toString().trim()

    if (name && congregation) {
      volunteers.push({ name, congregation })
    }
  }

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
