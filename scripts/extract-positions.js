const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function extractPositions() {
  try {
    // Find the completed circuit assembly event
    const event = await prisma.events.findFirst({
      where: {
        eventType: 'CIRCUIT_ASSEMBLY'
      },
      orderBy: {
        startDate: 'desc'
      },
      include: {
        positions: {
          include: {
            departments: true
          },
          orderBy: [
            { departments: { name: 'asc' } },
            { name: 'asc' }
          ]
        }
      }
    })

    if (!event) {
      console.log('No circuit assembly event found')
      return
    }

    console.log(`Found event: ${event.name}`)
    console.log(`Event ID: ${event.id}`)
    console.log(`Start Date: ${event.startDate}`)
    console.log(`Total Positions: ${event.positions.length}`)
    console.log('\n--- Positions by Department ---\n')

    // Group positions by department
    const positionsByDept = {}
    event.positions.forEach(pos => {
      const deptName = pos.departments?.name || 'No Department'
      if (!positionsByDept[deptName]) {
        positionsByDept[deptName] = []
      }
      positionsByDept[deptName].push({
        id: pos.id,
        name: pos.name,
        description: pos.description,
        requirements: pos.requirements,
        startTime: pos.startTime,
        endTime: pos.endTime,
        slots: pos.slots
      })
    })

    // Output positions grouped by department
    Object.keys(positionsByDept).sort().forEach(deptName => {
      console.log(`\n${deptName}:`)
      positionsByDept[deptName].forEach(pos => {
        console.log(`  - ${pos.name} (${pos.slots} slots)`)
        if (pos.description) {
          console.log(`    Description: ${pos.description}`)
        }
        if (pos.startTime && pos.endTime) {
          console.log(`    Time: ${pos.startTime} - ${pos.endTime}`)
        }
      })
    })

    // Output JSON for template creation
    console.log('\n\n--- JSON for Template ---\n')
    console.log(JSON.stringify(positionsByDept, null, 2))

    return { event, positionsByDept }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

extractPositions()
