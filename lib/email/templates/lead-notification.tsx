import * as React from 'react'

interface LeadNotificationEmailProps {
  operatorName: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  destination: string
  travelDates?: string
  travelers?: number
  interests?: string[]
  message?: string
  leadScore?: number
  dashboardUrl: string
}

export const LeadNotificationEmail: React.FC<LeadNotificationEmailProps> = ({
  operatorName,
  leadName,
  leadEmail,
  leadPhone,
  destination,
  travelDates,
  travelers,
  interests,
  message,
  leadScore,
  dashboardUrl,
}) => {
  const scoreColor = leadScore && leadScore >= 80 ? '#10b981' : leadScore && leadScore >= 50 ? '#f59e0b' : '#6b7280'
  const scoreLabel = leadScore && leadScore >= 80 ? 'Hot' : leadScore && leadScore >= 50 ? 'Warm' : 'New'

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#3b82f6', padding: '30px', borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px' }}>
            🎉 New Lead Alert!
          </h1>
        </div>

        {/* Body */}
        <div style={{ backgroundColor: '#ffffff', padding: '30px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
            Hi {operatorName},
          </p>

          <p style={{ margin: '0 0 20px 0' }}>
            Great news! You have a new lead interested in tours to <strong>{destination}</strong>.
          </p>

          {/* Lead Score Badge */}
          {leadScore && (
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                backgroundColor: scoreColor,
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {scoreLabel} Lead • Score: {leadScore}/100
              </span>
            </div>
          )}

          {/* Lead Details */}
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151' }}>
              Lead Details
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280', width: '120px' }}>Name:</td>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{leadName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Email:</td>
                  <td style={{ padding: '8px 0' }}>
                    <a href={`mailto:${leadEmail}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {leadEmail}
                    </a>
                  </td>
                </tr>
                {leadPhone && (
                  <tr>
                    <td style={{ padding: '8px 0', color: '#6b7280' }}>Phone:</td>
                    <td style={{ padding: '8px 0' }}>
                      <a href={`tel:${leadPhone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {leadPhone}
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Destination:</td>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{destination}</td>
                </tr>
                {travelDates && (
                  <tr>
                    <td style={{ padding: '8px 0', color: '#6b7280' }}>Travel Dates:</td>
                    <td style={{ padding: '8px 0' }}>{travelDates}</td>
                  </tr>
                )}
                {travelers && (
                  <tr>
                    <td style={{ padding: '8px 0', color: '#6b7280' }}>Travelers:</td>
                    <td style={{ padding: '8px 0' }}>{travelers} people</td>
                  </tr>
                )}
              </tbody>
            </table>

            {interests && interests.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Interests:</p>
                <div>
                  {interests.map((interest, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#e5e7eb',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        marginRight: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {message && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Message:</p>
                <p style={{ margin: 0, fontStyle: 'italic', backgroundColor: '#ffffff', padding: '12px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                  "{message}"
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <a
              href={dashboardUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              View in Dashboard →
            </a>
          </div>

          {/* Tips */}
          <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>💡 Pro Tip:</strong> Respond within 1 hour to increase your booking rate by 50%!
            </p>
          </div>

          {/* Footer */}
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0 20px 0' }} />
          
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            This is an automated notification from TripNav AI.
            <br />
            <a href="{unsubscribeUrl}" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Manage notification preferences
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export const LeadNotificationEmailText = ({
  operatorName,
  leadName,
  leadEmail,
  leadPhone,
  destination,
  travelDates,
  travelers,
  interests,
  message,
  leadScore,
  dashboardUrl,
}: LeadNotificationEmailProps) => {
  const scoreLabel = leadScore && leadScore >= 80 ? 'Hot' : leadScore && leadScore >= 50 ? 'Warm' : 'New'

  return `
New Lead Alert!

Hi ${operatorName},

Great news! You have a new lead interested in tours to ${destination}.

${leadScore ? `Lead Score: ${scoreLabel} (${leadScore}/100)` : ''}

LEAD DETAILS:
- Name: ${leadName}
- Email: ${leadEmail}
${leadPhone ? `- Phone: ${leadPhone}` : ''}
- Destination: ${destination}
${travelDates ? `- Travel Dates: ${travelDates}` : ''}
${travelers ? `- Travelers: ${travelers} people` : ''}
${interests && interests.length > 0 ? `- Interests: ${interests.join(', ')}` : ''}

${message ? `Message from lead:\n"${message}"` : ''}

View full details in your dashboard: ${dashboardUrl}

Pro Tip: Respond within 1 hour to increase your booking rate by 50%!

---
This is an automated notification from TripNav AI.
`
}