import { prisma } from '@/lib/prisma'

/**
 * Resolves a volunteer by email using case-insensitive match (emails are not
 * case-sensitive for practical purposes). Returns the row with the canonical
 * `email` value as stored in the database.
 */
export async function findVolunteerByEmailCaseInsensitive(email: string) {
  const trimmed = email.trim()
  if (!trimmed) {
    return null
  }
  return prisma.volunteers.findFirst({
    where: {
      email: { equals: trimmed, mode: 'insensitive' }
    }
  })
}
