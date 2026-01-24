const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdminUser() {
  try {
    console.log('🔍 Checking existing users...')
    
    const existingUsers = await prisma.users.findMany({
      select: { id: true, email: true, role: true }
    })
    
    console.log(`Found ${existingUsers.length} existing users:`)
    existingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`)
    })

    // Check if admin user already exists
    const adminUser = await prisma.users.findUnique({
      where: { email: 'admin@theoshift.local' }
    })

    if (adminUser) {
      console.log('✅ Admin user already exists!')
      return
    }

    console.log('🚀 Creating admin user...')
    
    // Create admin user
    const newAdmin = await prisma.users.create({
      data: {
        id: `admin_${Date.now()}`,
        email: 'admin@theoshift.local',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        isActive: true,
        passwordHash: await bcrypt.hash('AdminPass123!', 12), // Default password
        updatedAt: new Date(),
        createdAt: new Date()
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log(`   Email: ${newAdmin.email}`)
    console.log(`   Role: ${newAdmin.role}`)
    console.log(`   ID: ${newAdmin.id}`)
    console.log('')
    console.log('🔑 You can now sign in with:')
    console.log('   Email: admin@theoshift.local')
    console.log('   Password: AdminPass123!')

  } catch (error) {
    console.error('❌ Error seeding admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdminUser()
