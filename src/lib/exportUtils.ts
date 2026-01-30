import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface OversightAssignment {
  assignmentId: string
  user: { id: string; name: string | null; email: string | null }
  position: { id: string; name: string; number: number; department: string | null }
  shift: { start: string | null; end: string | null }
  status: string
  notes: string | null
}

interface OversightData {
  event: { id: string; name: string }
  statistics: {
    totalPositions: number
    positionsWithOversight: number
    positionsWithoutOversight: number
    coveragePercentage: number
    overseerCount: number
    assistantOverseerCount: number
    keymanCount: number
  }
  overseers: OversightAssignment[]
  assistantOverseers: OversightAssignment[]
  keymen: OversightAssignment[]
  coverageGaps: Array<{ id: string; name: string; number: number; department: string | null }>
}

export function exportOversightToPDF(data: OversightData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(30, 64, 175) // Blue
  doc.text('Event Oversight Report', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(data.event.name, pageWidth / 2, 30, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 37, { align: 'center' })
  
  let yPos = 50
  
  // Statistics Section
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Coverage Statistics', 14, yPos)
  yPos += 10
  
  const stats = [
    ['Total Positions', data.statistics.totalPositions.toString()],
    ['Positions with Oversight', data.statistics.positionsWithOversight.toString()],
    ['Positions without Oversight', data.statistics.positionsWithoutOversight.toString()],
    ['Coverage Percentage', `${data.statistics.coveragePercentage}%`],
    ['Overseers', data.statistics.overseerCount.toString()],
    ['Assistant Overseers', data.statistics.assistantOverseerCount.toString()],
    ['Keymen', data.statistics.keymanCount.toString()]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: stats,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: 14, right: 14 }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 15
  
  // Overseers Section
  if (data.overseers.length > 0) {
    doc.setFontSize(14)
    doc.text('Overseers', 14, yPos)
    yPos += 7
    
    const overseerData = data.overseers.map(o => [
      o.user.name || 'N/A',
      `#${o.position.number} - ${o.position.name}`,
      o.position.department || 'N/A',
      o.status
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Position', 'Department', 'Status']],
      body: overseerData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: 14, right: 14 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Assistant Overseers Section
  if (data.assistantOverseers.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.text('Assistant Overseers', 14, yPos)
    yPos += 7
    
    const assistantData = data.assistantOverseers.map(a => [
      a.user.name || 'N/A',
      `#${a.position.number} - ${a.position.name}`,
      a.position.department || 'N/A',
      a.status
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Position', 'Department', 'Status']],
      body: assistantData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: 14, right: 14 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Keymen Section
  if (data.keymen.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.text('Keymen', 14, yPos)
    yPos += 7
    
    const keymenData = data.keymen.map(k => [
      k.user.name || 'N/A',
      `#${k.position.number} - ${k.position.name}`,
      k.position.department || 'N/A',
      k.status
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Position', 'Department', 'Status']],
      body: keymenData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: 14, right: 14 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Coverage Gaps Section
  if (data.coverageGaps.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setTextColor(220, 38, 38) // Red
    doc.text('⚠️ Coverage Gaps', 14, yPos)
    yPos += 7
    
    const gapData = data.coverageGaps.map(g => [
      g.number.toString(),
      g.name,
      g.department || 'N/A'
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Position #', 'Position Name', 'Department']],
      body: gapData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 14, right: 14 }
    })
  }
  
  // Save the PDF
  const fileName = `oversight-report-${data.event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export function exportOversightToExcel(data: OversightData) {
  const workbook = XLSX.utils.book_new()
  
  // Statistics Sheet
  const statsData = [
    ['Event Oversight Report'],
    ['Event Name:', data.event.name],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Coverage Statistics'],
    ['Metric', 'Value'],
    ['Total Positions', data.statistics.totalPositions],
    ['Positions with Oversight', data.statistics.positionsWithOversight],
    ['Positions without Oversight', data.statistics.positionsWithoutOversight],
    ['Coverage Percentage', `${data.statistics.coveragePercentage}%`],
    ['Overseers', data.statistics.overseerCount],
    ['Assistant Overseers', data.statistics.assistantOverseerCount],
    ['Keymen', data.statistics.keymanCount]
  ]
  
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics')
  
  // Overseers Sheet
  if (data.overseers.length > 0) {
    const overseerData = [
      ['Name', 'Email', 'Position #', 'Position Name', 'Department', 'Status', 'Notes']
    ]
    
    data.overseers.forEach(o => {
      overseerData.push([
        o.user.name || 'N/A',
        o.user.email || 'N/A',
        o.position.number.toString(),
        o.position.name,
        o.position.department || 'N/A',
        o.status,
        o.notes || ''
      ])
    })
    
    const overseerSheet = XLSX.utils.aoa_to_sheet(overseerData)
    XLSX.utils.book_append_sheet(workbook, overseerSheet, 'Overseers')
  }
  
  // Assistant Overseers Sheet
  if (data.assistantOverseers.length > 0) {
    const assistantData = [
      ['Name', 'Email', 'Position #', 'Position Name', 'Department', 'Status', 'Notes']
    ]
    
    data.assistantOverseers.forEach(a => {
      assistantData.push([
        a.user.name || 'N/A',
        a.user.email || 'N/A',
        a.position.number.toString(),
        a.position.name,
        a.position.department || 'N/A',
        a.status,
        a.notes || ''
      ])
    })
    
    const assistantSheet = XLSX.utils.aoa_to_sheet(assistantData)
    XLSX.utils.book_append_sheet(workbook, assistantSheet, 'Assistant Overseers')
  }
  
  // Keymen Sheet
  if (data.keymen.length > 0) {
    const keymenData = [
      ['Name', 'Email', 'Position #', 'Position Name', 'Department', 'Status', 'Notes']
    ]
    
    data.keymen.forEach(k => {
      keymenData.push([
        k.user.name || 'N/A',
        k.user.email || 'N/A',
        k.position.number.toString(),
        k.position.name,
        k.position.department || 'N/A',
        k.status,
        k.notes || ''
      ])
    })
    
    const keymenSheet = XLSX.utils.aoa_to_sheet(keymenData)
    XLSX.utils.book_append_sheet(workbook, keymenSheet, 'Keymen')
  }
  
  // Coverage Gaps Sheet
  if (data.coverageGaps.length > 0) {
    const gapData = [
      ['Position #', 'Position Name', 'Department']
    ]
    
    data.coverageGaps.forEach(g => {
      gapData.push([
        g.number.toString(),
        g.name,
        g.department || 'N/A'
      ])
    })
    
    const gapSheet = XLSX.utils.aoa_to_sheet(gapData)
    XLSX.utils.book_append_sheet(workbook, gapSheet, 'Coverage Gaps')
  }
  
  // Save the Excel file
  const fileName = `oversight-report-${data.event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
