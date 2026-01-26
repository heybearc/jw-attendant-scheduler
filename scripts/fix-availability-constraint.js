const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixConstraint() {
  try {
    console.log('Dropping old constraint...')
    await prisma.$executeRaw`
      ALTER TABLE volunteer_availability 
      DROP CONSTRAINT IF EXISTS volunteer_availability_status_check
    `
    
    console.log('Adding new constraint with PENDING status...')
    await prisma.$executeRaw`
      ALTER TABLE volunteer_availability 
      ADD CONSTRAINT volunteer_availability_status_check 
      CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'PARTIAL', 'PENDING'))
    `
    
    console.log('✅ Constraint updated successfully!')
  } catch (error) {
    console.error('❌ Error updating constraint:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixConstraint()
