import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canManageIvsVolunteers, canViewIvsVolunteers } from '@/lib/eventAccess'
import {
  IvsDepartmentContactsMap,
  mergeIvsDepartmentContactsIntoSettings,
  readIvsDepartmentContacts,
} from '@/lib/ivsDepartmentContacts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID required' })
    }

    if (req.method === 'GET') {
      const canView = await canViewIvsVolunteers(session.user.id, eventId)
      const ivsTeamMember = !canView
        ? await prisma.position_assignments.findFirst({
            where: {
              volunteerId: session.user.id,
              positions: { eventId },
            },
            select: { id: true },
          })
        : null
      if (!canView && !ivsTeamMember) {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }

      const event = await prisma.events.findUnique({
        where: { id: eventId },
        select: { settings: true },
      })
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' })
      }

      const departments = await prisma.event_volunteers.findMany({
        where: {
          eventId,
          ivsImportBatchId: { not: null },
          ivsSubmittedBy: { not: null },
        },
        select: { ivsSubmittedBy: true },
        distinct: ['ivsSubmittedBy'],
      })

      const contacts = readIvsDepartmentContacts(event.settings)
      const volunteerDepartments = Array.from(
        new Set(departments.map((d) => d.ivsSubmittedBy!).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b))
      const departmentNames = Array.from(
        new Set([...volunteerDepartments, ...Object.keys(contacts)]),
      ).sort((a, b) => a.localeCompare(b))

      return res.status(200).json({
        success: true,
        contacts,
        departments: departmentNames,
        volunteerDepartments,
      })
    }

    if (req.method === 'PUT') {
      if (!(await canManageIvsVolunteers(session.user.id, eventId))) {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }

      const body = req.body && typeof req.body === 'object' ? req.body : {}
      const contacts = (body.contacts || {}) as IvsDepartmentContactsMap
      if (!contacts || typeof contacts !== 'object' || Array.isArray(contacts)) {
        return res.status(400).json({ success: false, message: 'contacts object required' })
      }

      const event = await prisma.events.findUnique({
        where: { id: eventId },
        select: { settings: true },
      })
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' })
      }

      const nextSettings = mergeIvsDepartmentContactsIntoSettings(event.settings, contacts)
      await prisma.events.update({
        where: { id: eventId },
        data: { settings: nextSettings, updatedAt: new Date() },
      })

      return res.status(200).json({
        success: true,
        contacts: readIvsDepartmentContacts(nextSettings),
      })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('IVS department contacts error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return res.status(500).json({ success: false, message })
  }
}
