import { NextRequest, NextResponse } from 'next/server'

// Simulate email sending for development
async function simulateEmailSend(emailData: any) {
  console.log('Simulating email send:', emailData)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // In development, return success
  if (process.env.NODE_ENV === 'development') {
    return { data: { id: 'simulated-email-id' }, error: null }
  }
  
  // In production without email service configured, return an error
  return { data: null, error: new Error('Email service not configured') }
}

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      tripId,
      tripTitle,
      destination,
      startDate,
      endDate,
      shareableLink
    } = await request.json()

    if (!email || !tripTitle || !destination || !shareableLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Format dates
    const start = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const end = new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    // If Resend API key is not configured, use a fallback method
    if (!process.env.RESEND_API_KEY) {
      console.log('Email sending simulated:', { email, tripTitle, shareableLink })
      
      // In development, we can open the user's email client
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Email client opened',
          mailtoLink: `mailto:${email}?subject=${encodeURIComponent(`Check out my ${destination} itinerary!`)}&body=${encodeURIComponent(
            `Hi there!\n\nI'm excited to share my ${destination} travel itinerary with you.\n\nTrip: ${tripTitle}\nDates: ${start} - ${end}\n\nView the full itinerary here:\n${shareableLink}\n\nLooking forward to hearing your thoughts!\n\nBest regards`
          )}`
        })
      }
      
      return NextResponse.json({ success: true, message: 'Email sent (simulated)' })
    }

    // For now, we'll simulate email sending
    // In production, you would integrate with Resend, SendGrid, or another email service
    const { data, error } = await simulateEmailSend({
      from: 'TripNav <noreply@tripnav.com>',
      to: [email],
      subject: `Check out my ${destination} itinerary!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #1f5582;
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .button {
                display: inline-block;
                background-color: #ff6b35;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .details {
                background-color: white;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">You've Been Invited to View a Travel Itinerary!</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Someone special has shared their travel plans with you. Take a look at their exciting itinerary:</p>
              
              <div class="details">
                <h2 style="color: #1f5582; margin-top: 0;">${tripTitle}</h2>
                <p><strong>Destination:</strong> ${destination}</p>
                <p><strong>Travel Dates:</strong> ${start} - ${end}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${shareableLink}" class="button">View Full Itinerary</a>
              </div>
              
              <p>You can view all the details, including daily activities, places to visit, and travel tips.</p>
              
              <p>Happy travels!</p>
            </div>
            
            <div class="footer">
              <p>This email was sent by TripNav. If you have any questions, please visit our website.</p>
              <p>&copy; ${new Date().getFullYear()} TripNav. All rights reserved.</p>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}