import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canViewIvsVolunteers } from '@/lib/eventAccess'
import {
  CONVENTION_DAYS,
  conventionDayLabel,
  earlyCheckinInclude,
  earlyEligibilityWhere,
  formatEarlyEntrySummary,
  isCheckedInForDay,
  isEligibleForDay,
  scheduleFromRecord,
  shortDayLabel,
} from '@/lib/ivsEarlyCheckin'
import ExcelJS from 'exceljs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!(await canViewIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Get event details
    const event = await prisma.events.findUnique({
      where: { id: eventId as string },
      select: { name: true },
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const volunteers = await prisma.event_volunteers.findMany({
      where: {
        eventId: eventId as string,
        ...earlyEligibilityWhere(),
      },
      include: earlyCheckinInclude,
      orderBy: [{ volunteer: { lastName: 'asc' } }],
    })

    const data = volunteers.map((v) => {
      const schedule = scheduleFromRecord(v)
      const checkIns = Object.fromEntries(
        v.earlyCheckins.map((c) => [c.conventionDay, c]),
      )
      const dayStatus = (day: (typeof CONVENTION_DAYS)[number]) => {
        if (!isEligibleForDay(schedule, day)) return '—'
        const row = checkIns[day]
        return row
          ? `Checked in ${new Date(row.checkedInAt).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}`
          : 'Pending'
      }

      return {
        Name: `${v.volunteer?.firstName || ''} ${v.volunteer?.lastName || ''}`.trim(),
        Congregation: v.volunteer?.congregation || '',
        'Early entry days': formatEarlyEntrySummary(schedule),
        Friday: dayStatus(CONVENTION_DAYS[0]),
        Saturday: dayStatus(CONVENTION_DAYS[1]),
        Sunday: dayStatus(CONVENTION_DAYS[2]),
      }
    })

    const checkedInAny = volunteers.filter((v) => v.earlyCheckins.length > 0).length
    const totalCount = volunteers.length

    const summaryData = [
      { Name: 'IVS EARLY CHECK-IN REPORT', Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: `Event: ${event.name}`, Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: `Generated: ${new Date().toLocaleString()}`, Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: '', Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: 'SUMMARY', Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: 'Total with early entry:', Congregation: totalCount.toString(), 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: 'Checked in (any day):', Congregation: checkedInAny.toString(), 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: '', Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
      { Name: 'VOLUNTEER LIST', Congregation: '', 'Early entry days': '', Friday: '', Saturday: '', Sunday: '' },
    ]

    const fullData = [...summaryData, ...data]

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Early Check-In')
    worksheet.columns = [
      { header: 'Name', key: 'Name', width: 25 },
      { header: 'Congregation', key: 'Congregation', width: 30 },
      { header: 'Early entry days', key: 'Early entry days', width: 18 },
      { header: 'Friday', key: 'Friday', width: 22 },
      { header: 'Saturday', key: 'Saturday', width: 22 },
      { header: 'Sunday', key: 'Sunday', width: 22 },
    ]
    fullData.forEach(row => worksheet.addRow(row))

    // Generate Excel file
    const excelBuffer = Buffer.from(await workbook.xlsx.writeBuffer())

    // Set headers for file download
    const fileName = `IVS_Early_CheckIn_Report_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    return res.status(200).send(excelBuffer)
  } catch (error) {
    console.error('Error exporting check-in report:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
