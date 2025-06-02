import { EmailTemplateData, CrmItineraryData, CrmResponse } from '../types/crm-integration';

/**
 * Email Configuration
 */
interface EmailConfig {
  from: string;
  replyTo?: string;
  provider: 'sendgrid' | 'smtp' | 'console'; // console for demo
}

/**
 * Email Service
 * 
 * Handles email generation and sending for non-CRM users.
 * This is a placeholder implementation that logs emails to console.
 */
export class EmailService {
  private static instance: EmailService;
  private config: EmailConfig;
  private sentEmails: Map<string, any> = new Map();
  
  private constructor() {
    // Default configuration for demo
    this.config = {
      from: 'noreply@trypto.ai',
      replyTo: 'support@trypto.ai',
      provider: 'console' // Log to console for demo
    };
    
    console.log('[EmailService] Initialized with provider:', this.config.provider);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  /**
   * Send itinerary email
   */
  async sendItineraryEmail(data: EmailTemplateData): Promise<CrmResponse<boolean>> {
    try {
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate email content
      const subject = `Your Trip Itinerary: ${data.itinerary.title}`;
      const htmlContent = this.generateItineraryHtml(data);
      const textContent = this.generateItineraryText(data);
      
      const email = {
        id: emailId,
        to: data.recipientEmail,
        from: this.config.from,
        replyTo: this.config.replyTo,
        subject,
        html: htmlContent,
        text: textContent,
        timestamp: new Date(),
        metadata: {
          itineraryId: data.itinerary.id,
          recipientName: data.recipientName
        }
      };
      
      // Send email based on provider
      await this.sendEmail(email);
      
      // Store sent email
      this.sentEmails.set(emailId, email);
      
      return {
        success: true,
        data: true,
        metadata: {
          emailId,
          sentAt: new Date().toISOString(),
          provider: this.config.provider
        }
      };
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }
  
  /**
   * Send lead notification email to sales team
   */
  async sendLeadNotificationEmail(
    leadId: string,
    contactInfo: any,
    itinerary?: CrmItineraryData
  ): Promise<CrmResponse<boolean>> {
    try {
      const emailId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subject = `New Lead: ${itinerary?.title || 'Travel Inquiry'}`;
      const htmlContent = this.generateLeadNotificationHtml(leadId, contactInfo, itinerary);
      
      const email = {
        id: emailId,
        to: 'sales@trypto.ai', // Would be configurable
        from: this.config.from,
        subject,
        html: htmlContent,
        timestamp: new Date(),
        metadata: {
          leadId,
          contactId: contactInfo.id
        }
      };
      
      await this.sendEmail(email);
      
      this.sentEmails.set(emailId, email);
      
      return {
        success: true,
        data: true,
        metadata: {
          emailId,
          sentAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[EmailService] Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }
  
  /**
   * Generate HTML content for itinerary email
   */
  private generateItineraryHtml(data: EmailTemplateData): string {
    const { itinerary, recipientName, personalMessage, senderInfo } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${itinerary.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .destinations { margin: 20px 0; }
    .destination { background: white; padding: 10px; margin: 5px 0; border-radius: 5px; }
    .details { margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${itinerary.title}</h1>
      <p>${itinerary.duration} days | ${itinerary.travelers} travelers</p>
    </div>
    
    <div class="content">
      ${recipientName ? `<p>Dear ${recipientName},</p>` : ''}
      
      ${personalMessage ? `<p>${personalMessage}</p>` : '<p>Here\'s your customized travel itinerary!</p>'}
      
      <div class="destinations">
        <h2>Destinations</h2>
        ${itinerary.destinations.map(dest => `
          <div class="destination">${dest}</div>
        `).join('')}
      </div>
      
      <div class="details">
        <h2>Trip Details</h2>
        <ul>
          <li><strong>Duration:</strong> ${itinerary.duration} days</li>
          <li><strong>Travelers:</strong> ${itinerary.travelers}</li>
          <li><strong>Total Cost:</strong> $${itinerary.totalCost.toLocaleString()}</li>
          ${itinerary.startDate ? `<li><strong>Start Date:</strong> ${new Date(itinerary.startDate).toLocaleDateString()}</li>` : ''}
        </ul>
      </div>
      
      <div class="highlights">
        <h2>Trip Highlights</h2>
        <ul>
          ${itinerary.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      </div>
    </div>
    
    <div class="footer">
      ${senderInfo ? `
        <p>Best regards,<br>
        ${senderInfo.name}<br>
        ${senderInfo.company || ''}<br>
        ${senderInfo.email}</p>
      ` : ''}
      <p>© ${new Date().getFullYear()} Trypto AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
  
  /**
   * Generate text content for itinerary email
   */
  private generateItineraryText(data: EmailTemplateData): string {
    const { itinerary, recipientName, personalMessage } = data;
    
    let text = '';
    
    if (recipientName) {
      text += `Dear ${recipientName},\n\n`;
    }
    
    text += personalMessage || 'Here\'s your customized travel itinerary!\n\n';
    
    text += `${itinerary.title}\n`;
    text += `${'-'.repeat(itinerary.title.length)}\n\n`;
    
    text += `Duration: ${itinerary.duration} days\n`;
    text += `Travelers: ${itinerary.travelers}\n`;
    text += `Total Cost: $${itinerary.totalCost.toLocaleString()}\n`;
    
    if (itinerary.startDate) {
      text += `Start Date: ${new Date(itinerary.startDate).toLocaleDateString()}\n`;
    }
    
    text += '\nDestinations:\n';
    itinerary.destinations.forEach(dest => {
      text += `- ${dest}\n`;
    });
    
    text += '\nTrip Highlights:\n';
    itinerary.highlights.forEach(highlight => {
      text += `- ${highlight}\n`;
    });
    
    return text;
  }
  
  /**
   * Generate HTML for lead notification
   */
  private generateLeadNotificationHtml(
    leadId: string,
    contactInfo: any,
    itinerary?: CrmItineraryData
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead Notification</title>
</head>
<body style="font-family: Arial, sans-serif;">
  <h2>New Lead Created</h2>
  
  <p><strong>Lead ID:</strong> ${leadId}</p>
  <p><strong>Contact:</strong> ${contactInfo.email || 'Unknown'}</p>
  
  ${itinerary ? `
    <h3>Itinerary Details</h3>
    <ul>
      <li><strong>Title:</strong> ${itinerary.title}</li>
      <li><strong>Destinations:</strong> ${itinerary.destinations.join(', ')}</li>
      <li><strong>Duration:</strong> ${itinerary.duration} days</li>
      <li><strong>Budget:</strong> $${itinerary.totalCost.toLocaleString()}</li>
    </ul>
  ` : '<p>No itinerary attached</p>'}
  
  <p>Please follow up with this lead as soon as possible.</p>
</body>
</html>
    `;
  }
  
  /**
   * Send email (placeholder implementation)
   */
  private async sendEmail(email: any): Promise<void> {
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (this.config.provider === 'console') {
      console.log('\n=== EMAIL SENT ===');
      console.log('To:', email.to);
      console.log('Subject:', email.subject);
      console.log('Provider:', this.config.provider);
      console.log('Timestamp:', email.timestamp);
      console.log('==================\n');
    } else {
      // In production, integrate with SendGrid, SMTP, etc.
      throw new Error(`Email provider ${this.config.provider} not implemented`);
    }
  }
  
  /**
   * Get sent emails (for testing/debugging)
   */
  getSentEmails(): Map<string, any> {
    return new Map(this.sentEmails);
  }
  
  /**
   * Clear sent emails
   */
  clearSentEmails(): void {
    this.sentEmails.clear();
    console.log('[EmailService] Cleared sent emails');
  }
} 