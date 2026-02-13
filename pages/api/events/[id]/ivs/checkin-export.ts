import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

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

    // Verify user has access to this event
    const eventPermission = await prisma.event_permissions.findFirst({
      where: {
        eventId: eventId as string,
        userId: session.user.id,
      },
    })

    if (!eventPermission) {
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

    // Fetch all volunteers with early check-in eligibility
    const volunteers = await prisma.event_volunteers.findMany({
      where: {
        eventId: eventId as string,
        earlyCheckinEligible: true,
      },
      include: {
        volunteer: {
          select: {
            firstName: true,
            lastName: true,
            congregation: true,
          },
        },
      },
      orderBy: [
        { checkedInAt: 'asc' },
      ],
    })

    // Prepare data for Excel
    const data = volunteers.map(v => ({
      'Name': `${v.volunteer?.firstName || ''} ${v.volunteer?.lastName || ''}`.trim(),
      'Congregation': v.volunteer?.congregation || '',
      'Check-In Status': v.checkedInAt ? 'Checked In' : 'Pending',
      'Check-In Time': v.checkedInAt 
        ? new Date(v.checkedInAt).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : '',
      'Checked In By': v.checkedInBy || '',
    }))

    // Add summary stats at the top
    const checkedInCount = volunteers.filter(v => v.checkedInAt).length
    const pendingCount = volunteers.filter(v => !v.checkedInAt).length
    const totalCount = volunteers.length

    const summaryData = [
      { 'Name': 'IVS EARLY CHECK-IN REPORT', 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': `Event: ${event.name}`, 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': `Generated: ${new Date().toLocaleString()}`, 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': '', 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': 'SUMMARY', 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': 'Total Eligible:', 'Congregation': totalCount.toString(), 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': 'Checked In:', 'Congregation': checkedInCount.toString(), 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': 'Pending:', 'Congregation': pendingCount.toString(), 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': '', 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
      { 'Name': 'VOLUNTEER LIST', 'Congregation': '', 'Check-In Status': '', 'Check-In Time': '', 'Checked In By': '' },
    ]

    const fullData = [...summaryData, ...data]

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(fullData, {
      header: ['Name', 'Congregation', 'Check-In Status', 'Check-In Time', 'Checked In By'],
    })

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 30 }, // Congregation
      { wch: 15 }, // Check-In Status
      { wch: 20 }, // Check-In Time
      { wch: 20 }, // Checked In By
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Early Check-In')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Set headers for file download
    const fileName = `IVS_Early_CheckIn_Report_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    return res.status(200).send(excelBuffer)
  } catch (error) {
    console.error('Error exporting check-in report:', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
