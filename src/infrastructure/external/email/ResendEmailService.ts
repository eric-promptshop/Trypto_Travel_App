import { injectable } from 'inversify';
import { EmailService } from '@/src/core/application/tour/TourApplicationService';
import { emailService as existingEmailService } from '@/lib/email/email-service';

@injectable()
export class ResendEmailService implements EmailService {
  async send(params: {
    to: string;
    template: string;
    data: any;
  }): Promise<void> {
    try {
      // Map template names to email methods
      switch (params.template) {
        case 'tour-created':
          await this.sendTourCreatedEmail(params.to, params.data);
          break;
        
        case 'tour-published':
          await this.sendTourPublishedEmail(params.to, params.data);
          break;
        
        case 'tour-archived':
          await this.sendTourArchivedEmail(params.to, params.data);
          break;
        
        case 'lead-captured':
          await existingEmailService.sendLeadNotification({
            operatorEmail: params.to,
            operatorName: params.data.operatorName,
            leadName: params.data.leadName,
            leadEmail: params.data.leadEmail,
            leadPhone: params.data.leadPhone,
            destination: params.data.destination,
            travelDates: params.data.travelDates,
            travelers: params.data.travelers,
            interests: params.data.interests,
            message: params.data.message,
            leadScore: params.data.leadScore,
            dashboardUrl: params.data.dashboardUrl
          });
          break;
        
        case 'welcome-operator':
          await existingEmailService.sendWelcomeOperator({
            operatorEmail: params.to,
            operatorName: params.data.operatorName,
            businessName: params.data.businessName,
            dashboardUrl: params.data.dashboardUrl,
            setupGuideUrl: params.data.setupGuideUrl,
            supportEmail: params.data.supportEmail
          });
          break;
        
        default:
          // Generic email send
          await existingEmailService.send({
            to: params.to,
            subject: params.data.subject || 'Notification from TripNav',
            html: params.data.html || this.generateDefaultHtml(params.data),
            text: params.data.text || this.generateDefaultText(params.data)
          });
      }
    } catch (error) {
      console.error('Email send error:', error);
      // Don't throw to prevent operation failure due to email issues
      // In production, this could be sent to a queue for retry
    }
  }

  private async sendTourCreatedEmail(to: string, data: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Tour Created Successfully!</h2>
        <p>Your tour "<strong>${data.tourTitle}</strong>" has been created.</p>
        <p>Tour ID: ${data.tourId}</p>
        <p>
          <a href="${data.viewUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">
            View Tour
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          You can now publish your tour to make it available for travelers.
        </p>
      </div>
    `;

    await existingEmailService.send({
      to,
      subject: `Tour Created: ${data.tourTitle}`,
      html,
      text: `Your tour "${data.tourTitle}" has been created. View it at: ${data.viewUrl}`
    });
  }

  private async sendTourPublishedEmail(to: string, data: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎉 Tour Published!</h2>
        <p>Congratulations! Your tour "<strong>${data.tourTitle}</strong>" is now live.</p>
        <p>Tour ID: ${data.tourId}</p>
        <p>
          <a href="${data.viewUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
            View Live Tour
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Your tour is now visible to travelers and can start receiving bookings.
        </p>
      </div>
    `;

    await existingEmailService.send({
      to,
      subject: `🎉 Tour Published: ${data.tourTitle}`,
      html,
      text: `Your tour "${data.tourTitle}" has been published. View it at: ${data.viewUrl}`
    });
  }

  private async sendTourArchivedEmail(to: string, data: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Tour Archived</h2>
        <p>Your tour "<strong>${data.tourTitle}</strong>" has been archived.</p>
        <p>Tour ID: ${data.tourId}</p>
        <p style="color: #666; font-size: 14px;">
          Archived tours are no longer visible to travelers but can be restored at any time.
        </p>
      </div>
    `;

    await existingEmailService.send({
      to,
      subject: `Tour Archived: ${data.tourTitle}`,
      html,
      text: `Your tour "${data.tourTitle}" has been archived.`
    });
  }

  private generateDefaultHtml(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${data.title || 'Notification'}</h2>
        <p>${data.message || 'You have a new notification from TripNav.'}</p>
        ${data.actionUrl ? `
          <p>
            <a href="${data.actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">
              ${data.actionText || 'View Details'}
            </a>
          </p>
        ` : ''}
      </div>
    `;
  }

  private generateDefaultText(data: any): string {
    let text = `${data.title || 'Notification'}\n\n`;
    text += `${data.message || 'You have a new notification from TripNav.'}\n`;
    if (data.actionUrl) {
      text += `\n${data.actionText || 'View Details'}: ${data.actionUrl}`;
    }
    return text;
  }
}