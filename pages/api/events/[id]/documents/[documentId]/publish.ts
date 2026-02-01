import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '../../../../../../src/lib/prisma'
import { randomUUID } from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !['ADMIN', 'OVERSEER'].includes(session.user?.role || '')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id: eventId, documentId } = req.query

    if (!eventId || typeof eventId !== 'string' || !documentId || typeof documentId !== 'string') {
      return res.status(400).json({ success: false, error: 'Event ID and Document ID are required' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    return handlePublishDocument(req, res, eventId, documentId, session.user?.id || '')
  } catch (error) {
    console.error('Publish document API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handlePublishDocument(req: NextApiRequest, res: NextApiResponse, eventId: string, documentId: string, publishedBy: string) {
  try {
    const { publishType, attendantIds } = req.body

    if (!publishType || !['all', 'individual'].includes(publishType)) {
      return res.status(400).json({ success: false, error: 'Invalid publish type' })
    }

    if (publishType === 'individual' && (!attendantIds || !Array.isArray(attendantIds) || attendantIds.length === 0)) {
      return res.status(400).json({ success: false, error: 'Attendant IDs are required for individual publishing' })
    }

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    let publishedCount = 0

    if (publishType === 'all') {
      // Get all volunteers for this event using raw query
      const eventVolunteers = await prisma.$queryRaw`
        SELECT ev."volunteerId", v."firstName", v."lastName"
        FROM event_volunteers ev
        JOIN volunteers v ON ev."volunteerId" = v.id
        WHERE ev."eventId" = ${eventId}
        AND ev."isActive" = true
      ` as any[]

      publishedCount = eventVolunteers.length

      // Create document_publications records for all volunteers
      for (const volunteer of eventVolunteers) {
        await prisma.$executeRaw`
          INSERT INTO document_publications (id, "documentId", "attendantId", "publishedAt")
          VALUES (${randomUUID()}, ${documentId}, ${volunteer.volunteerId}, NOW())
          ON CONFLICT ("documentId", "attendantId") DO NOTHING
        `
      }
      
      console.log(`Published document ${documentId} to all ${publishedCount} volunteers in event ${eventId}`)
    } else {
      // Verify volunteers exist and are part of this event
      const eventVolunteers = await prisma.$queryRaw`
        SELECT ev."volunteerId", v."firstName", v."lastName"
        FROM event_volunteers ev
        JOIN volunteers v ON ev."volunteerId" = v.id
        WHERE ev."eventId" = ${eventId}
        AND ev."volunteerId" = ANY(${attendantIds})
        AND ev."isActive" = true
      ` as any[]

      if (eventVolunteers.length !== attendantIds.length) {
        return res.status(400).json({ success: false, error: 'Some volunteers are not part of this event' })
      }

      publishedCount = eventVolunteers.length

      // Create document_publications records for selected volunteers
      for (const volunteer of eventVolunteers) {
        await prisma.$executeRaw`
          INSERT INTO document_publications (id, "documentId", "attendantId", "publishedAt")
          VALUES (${randomUUID()}, ${documentId}, ${volunteer.volunteerId}, NOW())
          ON CONFLICT ("documentId", "attendantId") DO NOTHING
        `
      }
      
      console.log(`Published document ${documentId} to ${publishedCount} selected volunteers in event ${eventId}`)
    }

    // Update document record with publish status
    await prisma.event_documents.update({
      where: { id: documentId },
      data: {
        publishedTo: publishType,
        publishedCount: publishedCount,
        updatedAt: new Date()
      }
    })

    // Send email notifications to volunteers (fire and forget)
    if (publishedCount > 0) {
      // Don't await - send emails in background
      (async () => {
        try {
          const { sendDocumentPublishEmail, isEmailConfigured } = require('../../../../../../src/lib/email')
          
          const emailConfigured = await isEmailConfigured()
          if (!emailConfigured) {
            console.log('Email not configured, skipping document notifications')
            return
          }
          
          // Get volunteers with email addresses
          const volunteerIds = publishType === 'all' 
            ? (await prisma.$queryRaw`SELECT "volunteerId" FROM event_volunteers WHERE "eventId" = ${eventId} AND "isActive" = true` as any[]).map((v: any) => v.volunteerId)
            : attendantIds
          
          const volunteers = await prisma.volunteers.findMany({
            where: {
              id: { in: volunteerIds },
              email: { not: null }
            },
            select: { id: true, firstName: true, email: true }
          })
          
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
          const documentUrl = `${baseUrl}/events/${eventId}/documents`
          
          // Send emails
          for (const volunteer of volunteers) {
            if (volunteer.email) {
              try {
                await sendDocumentPublishEmail({
                  firstName: volunteer.firstName,
                  email: volunteer.email,
                  documentTitle: document.title,
                  eventName: event.name,
                  documentUrl: documentUrl
                })
              } catch (err) {
                console.error(`Failed to send email to ${volunteer.email}:`, err)
              }
            }
          }
          
          console.log(`✅ Sent ${volunteers.length} document publish notifications`)
        } catch (emailError) {
          console.error('Failed to send document notifications:', emailError)
        }
      })()
    }

    return res.status(200).json({
      success: true,
      data: {
        publishType,
        publishedCount,
        publishedAt: new Date().toISOString()
      },
      message: `Document published to ${publishedCount} attendant${publishedCount !== 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Publish document error:', error)
    return res.status(500).json({ success: false, error: 'Failed to publish document' })
  }
}
