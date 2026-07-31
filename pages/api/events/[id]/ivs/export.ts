import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { handleApiError } from '@/lib/apiError'
import { canManageIvsVolunteers } from '@/lib/eventAccess'

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

    if (!(await canManageIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({
        success: false,
        message:
          'Forbidden — export requires event volunteer-management access, platform overseer/keyman, or event creator',
      })
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
      EMAIL: ev.volunteer?.email || '',
      PHONE: ev.volunteer?.phone || '',
      'APPROVAL STATUS': ev.ivsApprovalStatus || 'Pending',
      'APPROVAL DATE':
        (ev.ivsApprovalStatus || 'Pending') === 'Approved' && ev.ivsApprovedAt
          ? formatDate(ev.ivsApprovedAt)
          : '',
      DEPARTMENT: ev.ivsSubmittedBy || '',
      ROUND: ev.ivsRequestRound || '',
      NOTES: ev.ivsApprovalNotes || '',
    }))

    // Generate Excel file
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Volunteers')
    worksheet.columns = [
      { header: 'NAME', key: 'NAME', width: 25 },
      { header: 'CONGREGATION', key: 'CONGREGATION', width: 20 },
      { header: 'EMAIL', key: 'EMAIL', width: 28 },
      { header: 'PHONE', key: 'PHONE', width: 16 },
      { header: 'APPROVAL STATUS', key: 'APPROVAL STATUS', width: 15 },
      { header: 'APPROVAL DATE', key: 'APPROVAL DATE', width: 15 },
      { header: 'DEPARTMENT', key: 'DEPARTMENT', width: 20 },
      { header: 'ROUND', key: 'ROUND', width: 8 },
      { header: 'NOTES', key: 'NOTES', width: 30 },
    ]
    exportData.forEach(row => worksheet.addRow(row))

    // Generate file buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

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
  }
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}
