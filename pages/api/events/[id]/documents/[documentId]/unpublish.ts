import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '../../../../../../src/lib/prisma'

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

    return handleUnpublishDocument(req, res, eventId, documentId)
  } catch (error) {
    console.error('Unpublish document API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleUnpublishDocument(req: NextApiRequest, res: NextApiResponse, eventId: string, documentId: string) {
  try {
    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    // Verify document exists
    const document = await prisma.event_documents.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    // Delete all document_publications for this document
    const deleteResult = await prisma.document_publications.deleteMany({
      where: {
        documentId: documentId
      }
    })

    // Update document record to reset publish status
    await prisma.event_documents.update({
      where: { id: documentId },
      data: {
        publishedTo: 'none',
        publishedCount: 0,
        publishedAt: null,
        updatedAt: new Date()
      }
    })

    console.log(`Unpublished document ${documentId} - removed ${deleteResult.count} publications`)

    return res.status(200).json({
      success: true,
      data: {
        removedPublications: deleteResult.count
      },
      message: `Document unpublished successfully. Removed from ${deleteResult.count} volunteer${deleteResult.count !== 1 ? 's' : ''}.`
    })
  } catch (error) {
    console.error('Unpublish document error:', error)
    return res.status(500).json({ success: false, error: 'Failed to unpublish document' })
  }
}
