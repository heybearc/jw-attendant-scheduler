import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import { handleApiError } from '@/lib/apiError'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
    const { departmentName, requestRound, format = 'xlsx' } = req.body

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

    // Build query filters
    const where: any = {
      eventId: eventId as string,
      ivsImportBatchId: { not: null }, // Only IVS volunteers
    }

    if (departmentName) {
      where.ivsSubmittedBy = departmentName
    }

    if (requestRound) {
      where.ivsRequestRound = parseInt(requestRound)
    }

    // Fetch volunteers with IVS data
    const eventVolunteers = await prisma.event_volunteers.findMany({
      where,
      include: {
        volunteer: true,
      },
      orderBy: [
        { ivsSubmittedBy: 'asc' },
        { volunteer: { lastName: 'asc' } },
        { volunteer: { firstName: 'asc' } },
      ],
    })

    if (eventVolunteers.length === 0) {
      return res.status(404).json({ success: false, message: 'No volunteers found for export' })
    }

    // Prepare export data
    const exportData = eventVolunteers.map(ev => ({
      NAME: `${ev.volunteer?.firstName || ''} ${ev.volunteer?.lastName || ''}`.trim(),
      CONGREGATION: ev.volunteer?.congregation || '',
      'APPROVAL STATUS': ev.ivsApprovalStatus || 'Pending',
      'APPROVAL DATE': ev.ivsApprovedAt ? formatDate(ev.ivsApprovedAt) : '',
      DEPARTMENT: ev.ivsSubmittedBy || '',
      ROUND: ev.ivsRequestRound || '',
      NOTES: ev.ivsApprovalNotes || '',
    }))

    // Generate Excel file
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Volunteers')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // NAME
      { wch: 20 }, // CONGREGATION
      { wch: 15 }, // APPROVAL STATUS
      { wch: 15 }, // APPROVAL DATE
      { wch: 20 }, // DEPARTMENT
      { wch: 8 },  // ROUND
      { wch: 30 }, // NOTES
    ]

    // Generate file buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format as any })

    // Generate filename
    const dept = departmentName || 'All-Departments'
    const round = requestRound || 'All-Rounds'
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '-')
    const filename = `${dept}_Volunteer_Approval_Request_${round}_UPDATED_${date}.${format}`

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)

    return res.status(200).send(buffer)
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}
