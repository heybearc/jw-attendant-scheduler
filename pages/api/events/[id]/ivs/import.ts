import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import formidable, { File } from 'formidable'
import ExcelJS from 'exceljs'
import { v4 as uuidv4 } from 'uuid'
import { handleApiError } from '@/lib/apiError'
import { canManageIvsVolunteers } from '@/lib/eventAccess'

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

    if (!(await canManageIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage IVS volunteers for this event',
      })
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
        
        // Parse name into first and last
        const { firstName, lastName } = parseName(volunteer.name)

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
          skipped++
          continue
        }
        

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
        await prisma.event_volunteers.create({
          data: {
            id: uuidv4(),
            eventId: eventId as string,
            volunteerId: globalVolunteer.id,
            userId: null,
            role: 'VOLUNTEER' as any,
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
      } catch (error) {
        // Error logged by handleApiError
        errors.push(`Error importing ${volunteer.name}: ${error.message}`)
      }
    }
    

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
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

async function parseVolunteerFile(file: File): Promise<ImportedVolunteer[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(file.filepath)
  const worksheet = workbook.worksheets[0]

  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error('File is empty')
  }

  // Validate header row
  const headerRow = worksheet.getRow(1).values as (string | undefined)[]
  // ExcelJS row.values is 1-indexed (index 0 is undefined)
  const nameHeader = headerRow[1]?.toString().trim().toUpperCase()
  const congregationHeader = headerRow[2]?.toString().trim().toUpperCase()

  if (!nameHeader || !congregationHeader || nameHeader !== 'NAME' || congregationHeader !== 'CONGREGATION') {
    throw new Error(`Invalid spreadsheet format. Expected columns: NAME, CONGREGATION. Found: ${headerRow[1]}, ${headerRow[2]}`)
  }

  const volunteers: ImportedVolunteer[] = []

  // Parse data rows (skip header row 1)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const values = row.values as (string | undefined)[]
    const name = values[1]?.toString().trim()
    const congregation = values[2]?.toString().trim()
    if (name && congregation) {
      volunteers.push({ name, congregation })
    }
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
