import { Resend } from 'resend'
import { LeadNotificationEmail, LeadNotificationEmailText } from './templates/lead-notification'
import { WelcomeOperatorEmail, WelcomeOperatorEmailText } from './templates/welcome-operator'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Fallback email service using console.log for development
class FallbackEmailService {
  async send(params: any) {
    console.log('📧 Email Service (Development Mode)')
    console.log('To:', params.to)
    console.log('From:', params.from)
    console.log('Subject:', params.subject)
    console.log('Text:', params.text)
    return { data: { id: 'dev-' + Date.now() }, error: null }
  }
}

const emailClient = resend || new FallbackEmailService()

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export class EmailService {
  private static instance: EmailService
  private from: string

  constructor() {
    this.from = process.env.EMAIL_FROM || 'TripNav AI <notifications@tripnav.ai>'
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async send(options: EmailOptions) {
    try {
      const { data, error } = await emailClient.send({
        from: options.from || this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      })

      if (error) {
        console.error('Email send error:', error)
        throw new Error(`Failed to send email: ${error.message || error}`)
      }

      return data
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  async sendLeadNotification(params: {
    operatorEmail: string
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
  }) {
    const emailText = LeadNotificationEmailText(params)

    // If using Resend, it can handle React components directly
    if (resend) {
      return resend.emails.send({
        from: this.from,
        to: params.operatorEmail,
        subject: `🎉 New Lead: ${params.leadName} - ${params.destination}`,
        react: LeadNotificationEmail(params),
        text: emailText,
      })
    }

    // Fallback for development
    return this.send({
      to: params.operatorEmail,
      subject: `🎉 New Lead: ${params.leadName} - ${params.destination}`,
      html: '<p>Lead notification email (React components not supported in dev mode)</p>',
      text: emailText,
    })
  }

  async sendWelcomeOperator(params: {
    operatorEmail: string
    operatorName: string
    businessName: string
    dashboardUrl: string
    setupGuideUrl: string
    supportEmail?: string
  }) {
    const emailParams = {
      ...params,
      supportEmail: params.supportEmail || 'support@tripnav.ai'
    }

    const emailText = WelcomeOperatorEmailText(emailParams)

    // If using Resend, it can handle React components directly
    if (resend) {
      return resend.emails.send({
        from: this.from,
        to: params.operatorEmail,
        subject: `Welcome to TripNav AI, ${params.businessName}! 🚀`,
        react: WelcomeOperatorEmail(emailParams),
        text: emailText,
      })
    }

    // Fallback for development
    return this.send({
      to: params.operatorEmail,
      subject: `Welcome to TripNav AI, ${params.businessName}! 🚀`,
      html: '<p>Welcome email (React components not supported in dev mode)</p>',
      text: emailText,
    })
  }

  async sendBulkEmails(emails: EmailOptions[]) {
    const results = await Promise.allSettled(
      emails.map(email => this.send(email))
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      successful,
      failed,
      results: results.map((result, index) => ({
        email: emails[index].to,
        status: result.status,
        error: result.status === 'rejected' ? result.reason : undefined
      }))
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()