import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import ExcelJS from 'exceljs'
import { canManageIvsVolunteers } from '@/lib/eventAccess'
import { IVS_APPROVAL_STATUSES } from '@/lib/ivs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('IVS Import')

    sheet.columns = [
      { header: 'NAME', key: 'name', width: 28 },
      { header: 'CONGREGATION', key: 'congregation', width: 28 },
      { header: 'DEPARTMENT', key: 'department', width: 18 },
      { header: 'STATUS', key: 'status', width: 14 },
      { header: 'EARLY ENTRY', key: 'earlyEntry', width: 18 },
    ]

    sheet.addRow({
      name: 'Jane Doe',
      congregation: 'Example Congregation',
      department: 'Parking',
      status: 'Pending',
      earlyEntry: 'Fri, Sat',
    })
    sheet.addRow({
      name: 'John Smith',
      congregation: 'Another Congregation',
      department: 'Security',
      status: 'Approved',
      earlyEntry: 'All days',
    })
    sheet.addRow({
      name: 'Mary Johnson',
      congregation: 'Sample Congregation',
      department: '',
      status: '',
      earlyEntry: 'No',
    })

    sheet.getRow(1).font = { bold: true }

    const notes = workbook.addWorksheet('Instructions')
    notes.getColumn(1).width = 90
    const lines = [
      'IVS Import Template',
      '',
      'Required columns:',
      '  NAME — Full name (first last)',
      '  CONGREGATION — Congregation name',
      '',
      'Optional columns (leave blank if not needed):',
      '  DEPARTMENT — Overrides the department set in the import dialog for that row',
      `  STATUS — One of: ${IVS_APPROVAL_STATUSES.join(', ')}`,
      '  EARLY ENTRY — Examples: Fri, Sat | Fri, Sun | All days | Yes | No',
      '',
      'Alternate early-entry columns (optional Yes/No):',
      '  EARLY ENTRY FRIDAY, EARLY ENTRY SATURDAY, EARLY ENTRY SUNDAY',
      '',
      'Notes:',
      '  • Early entry and status are optional — omit or leave blank to skip.',
      '  • Re-importing the same person updates department, status, and early entry when provided.',
      '  • If STATUS is blank, elders are auto-approved; everyone else starts as Pending.',
      '  • Request round is chosen in the import dialog (applies to the whole file).',
    ]
    lines.forEach((line, i) => {
      notes.getCell(i + 1, 1).value = line
    })

    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename="IVS_Import_Template.xlsx"')
    return res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('Error generating IVS import template:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
