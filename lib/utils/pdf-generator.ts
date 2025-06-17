import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface PDFGeneratorProps {
  tripId: string
  tripTitle: string
  destination: string
  startDate: string
  endDate: string
  itinerary: any
}

export async function generatePDF({
  tripTitle,
  destination,
  startDate,
  endDate,
  itinerary
}: PDFGeneratorProps) {
  try {
    // Create a temporary div to render the itinerary
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '800px'
    tempDiv.style.padding = '40px'
    tempDiv.style.backgroundColor = 'white'
    
    // Build HTML content
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #1f5582; margin-bottom: 10px;">${tripTitle}</h1>
        <h2 style="color: #666; font-size: 18px; margin-bottom: 20px;">${destination}</h2>
        <p style="color: #999; margin-bottom: 30px;">${formatDate(startDate)} - ${formatDate(endDate)}</p>
        
        ${itinerary?.days?.map((day: any, index: number) => `
          <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <h3 style="color: #1f5582; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Day ${index + 1} - ${formatDate(day.date)}
            </h3>
            ${day.slots?.map((slot: any) => {
              const poi = itinerary.pois.find((p: any) => p.id === slot.poiId)
              return poi ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #1f5582;">${poi.name}</h4>
                      ${slot.time ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">⏰ ${slot.time}</p>` : ''}
                      ${poi.location?.address ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">📍 ${poi.location.address}</p>` : ''}
                      ${poi.description ? `<p style="margin: 0; color: #666; font-size: 14px;">${poi.description}</p>` : ''}
                    </div>
                    ${poi.rating ? `
                      <div style="text-align: right;">
                        <p style="margin: 0; color: #f59e0b; font-size: 14px;">★ ${poi.rating.toFixed(1)}</p>
                      </div>
                    ` : ''}
                  </div>
                  ${slot.notes ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 14px; font-style: italic;">📝 ${slot.notes}</p>` : ''}
                </div>
              ` : ''
            }).join('') || '<p style="color: #999;">No activities planned for this day</p>'}
          </div>
        `).join('') || ''}
        
        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
          <p>Generated with TripNav • ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `
    
    document.body.appendChild(tempDiv)
    
    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    
    document.body.removeChild(tempDiv)
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = 295 // A4 height in mm
    
    let heightLeft = imgHeight
    let position = 0
    
    // Add image to PDF, handling multiple pages if needed
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // Save the PDF
    pdf.save(`${tripTitle.replace(/\s+/g, '-').toLowerCase()}-itinerary.pdf`)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}