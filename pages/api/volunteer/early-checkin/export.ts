import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

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

    const { eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID required' })
    }

    // Verify user is an IVS volunteer for this event
    const ivsVolunteer = await prisma.event_volunteers.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id,
        ivsSubmittedBy: 'IVS',
        ivsApprovalStatus: 'Approved',
      },
    })

    if (!ivsVolunteer) {
      return res.status(403).json({ success: false, message: 'Access denied - IVS volunteer access required' })
    }

    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { name: true },
    })

    // Fetch all volunteers eligible for early check-in
    const eventVolunteers = await prisma.event_volunteers.findMany({
      where: {
        eventId: eventId,
        earlyCheckinEligible: true,
      },
      include: {
        volunteer: true,
      },
      orderBy: [
        { checkedInAt: 'desc' },
        { volunteer: { lastName: 'asc' } },
      ],
    })

    const checkedInCount = eventVolunteers.filter(v => v.checkedInAt).length
    const pendingCount = eventVolunteers.filter(v => !v.checkedInAt).length

    const data = eventVolunteers.map(ev => ({
      'NAME': `${ev.volunteer?.firstName || ''} ${ev.volunteer?.lastName || ''}`.trim(),
      'CONGREGATION': ev.volunteer?.congregation || '',
      'STATUS': ev.checkedInAt ? 'Checked In' : 'Pending',
      'CHECK-IN TIME': ev.checkedInAt ? formatDateTime(ev.checkedInAt) : '',
      'CHECKED IN BY': ev.checkedInBy || '',
    }))

    // Add summary rows
    data.unshift({
      'NAME': '',
      'CONGREGATION': '',
      'STATUS': '',
      'CHECK-IN TIME': '',
      'CHECKED IN BY': '',
    })
    data.unshift({
      'NAME': 'Pending Check-In',
      'CONGREGATION': pendingCount.toString(),
      'STATUS': '',
      'CHECK-IN TIME': '',
      'CHECKED IN BY': '',
    })
    data.unshift({
      'NAME': 'Checked In',
      'CONGREGATION': checkedInCount.toString(),
      'STATUS': '',
      'CHECK-IN TIME': '',
      'CHECKED IN BY': '',
    })
    data.unshift({
      'NAME': 'Total Early Entry Eligible',
      'CONGREGATION': eventVolunteers.length.toString(),
      'STATUS': '',
      'CHECK-IN TIME': '',
      'CHECKED IN BY': '',
    })
    data.unshift({
      'NAME': `IVS Early Check-In Report - ${event?.name || 'Event'}`,
      'CONGREGATION': '',
      'STATUS': '',
      'CHECK-IN TIME': '',
      'CHECKED IN BY': '',
    })

    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Early Check-In')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="IVS_Early_CheckIn_Report.xlsx"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error exporting check-in report:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}

function formatDateTime(date: Date): string {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day}/${year} ${hours}:${minutes}`
}
