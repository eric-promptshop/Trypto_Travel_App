import * as React from 'react'

interface WelcomeOperatorEmailProps {
  operatorName: string
  businessName: string
  dashboardUrl: string
  setupGuideUrl: string
  supportEmail: string
}

export const WelcomeOperatorEmail: React.FC<WelcomeOperatorEmailProps> = ({
  operatorName,
  businessName,
  dashboardUrl,
  setupGuideUrl,
  supportEmail,
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#3b82f6', padding: '40px 30px', borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
          <h1 style={{ color: '#ffffff', margin: '0 0 10px 0', fontSize: '28px' }}>
            Welcome to TripNav AI! 🎉
          </h1>
          <p style={{ color: '#e0e7ff', margin: 0, fontSize: '16px' }}>
            Your tour business just got a powerful upgrade
          </p>
        </div>

        {/* Body */}
        <div style={{ backgroundColor: '#ffffff', padding: '30px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
            Hi {operatorName},
          </p>

          <p style={{ margin: '0 0 20px 0' }}>
            Welcome aboard! We're thrilled to have <strong>{businessName}</strong> join the TripNav AI platform. 
            You're now part of a growing community of tour operators revolutionizing travel planning with AI.
          </p>

          {/* Getting Started Steps */}
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#374151' }}>
              🚀 Get Started in 3 Easy Steps
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: '15px',
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Complete Your Profile</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Add your business details, logo, and tour offerings to attract more travelers.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: '15px',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Add Your First Tours</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Import existing tours or create new ones with our AI-powered tour builder.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: '15px',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Install Your Widget</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Add our customizable widget to your website and start capturing leads instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <a
              href={dashboardUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '14px 36px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            >
              Go to Dashboard →
            </a>
            <br />
            <a
              href={setupGuideUrl}
              style={{
                display: 'inline-block',
                color: '#3b82f6',
                padding: '10px',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              View Setup Guide
            </a>
          </div>

          {/* Features Highlight */}
          <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1e40af' }}>
              ✨ What You Can Do with TripNav AI
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
              <li style={{ marginBottom: '8px' }}>Capture and qualify leads automatically with AI</li>
              <li style={{ marginBottom: '8px' }}>Showcase tours to travelers planning trips to your destinations</li>
              <li style={{ marginBottom: '8px' }}>Get detailed analytics on lead behavior and preferences</li>
              <li style={{ marginBottom: '8px' }}>Automate follow-ups and nurture leads</li>
              <li>Integrate with your existing CRM and booking systems</li>
            </ul>
          </div>

          {/* Support Section */}
          <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#374151' }}>
              Need Help? We're Here for You!
            </h3>
            <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '14px' }}>
              Our support team is ready to help you succeed.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              style={{
                display: 'inline-block',
                backgroundColor: '#ffffff',
                color: '#374151',
                padding: '10px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              Contact Support
            </a>
          </div>

          {/* Footer */}
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0 20px 0' }} />
          
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            Welcome to the TripNav AI family!
            <br />
            <a href="{unsubscribeUrl}" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Manage email preferences
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export const WelcomeOperatorEmailText = ({
  operatorName,
  businessName,
  dashboardUrl,
  setupGuideUrl,
  supportEmail,
}: WelcomeOperatorEmailProps) => {
  return `
Welcome to TripNav AI!

Hi ${operatorName},

Welcome aboard! We're thrilled to have ${businessName} join the TripNav AI platform. You're now part of a growing community of tour operators revolutionizing travel planning with AI.

GET STARTED IN 3 EASY STEPS:

1. Complete Your Profile
   Add your business details, logo, and tour offerings to attract more travelers.

2. Add Your First Tours
   Import existing tours or create new ones with our AI-powered tour builder.

3. Install Your Widget
   Add our customizable widget to your website and start capturing leads instantly.

Go to Dashboard: ${dashboardUrl}
View Setup Guide: ${setupGuideUrl}

WHAT YOU CAN DO WITH TRIPNAV AI:
• Capture and qualify leads automatically with AI
• Showcase tours to travelers planning trips to your destinations
• Get detailed analytics on lead behavior and preferences
• Automate follow-ups and nurture leads
• Integrate with your existing CRM and booking systems

Need Help? We're Here for You!
Our support team is ready to help you succeed.
Contact us at: ${supportEmail}

Welcome to the TripNav AI family!

---
This email was sent by TripNav AI.
`
}