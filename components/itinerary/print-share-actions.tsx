'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Printer, 
  Share2, 
  Download, 
  QrCode, 
  Mail, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  FileText,
  Eye,
  X,
  Check,
  ExternalLink
} from 'lucide-react';
import { ResponsiveImage } from '../images/responsive-image';

// Import print styles
import './print-styles.css';

export interface ItineraryData {
  id: string;
  title: string;
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  travelers: number;
  days: Array<{
    date: string;
    activities: Array<{
      time: string;
      title: string;
      description: string;
      location: string;
      type: 'activity' | 'hotel' | 'flight' | 'meal' | 'transport';
      status?: 'confirmed' | 'pending' | 'cancelled';
      confirmationNumber?: string;
      notes?: string;
    }>;
  }>;
  contacts?: Array<{
    type: 'emergency' | 'hotel' | 'local';
    name: string;
    phone: string;
    email?: string;
  }>;
  notes?: string[];
}

interface PrintShareActionsProps {
  itinerary: ItineraryData;
  className?: string;
  variant?: 'buttons' | 'dropdown' | 'toolbar';
  showLabels?: boolean;
  onShare?: (method: string, success: boolean) => void;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void | Promise<void>;
}

export const PrintShareActions: React.FC<PrintShareActionsProps> = ({
  itinerary,
  className,
  variant = 'buttons',
  showLabels = true,
  onShare,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Generate QR code data URL
  const generateQRCode = useCallback(async (text: string): Promise<string> => {
    setIsGeneratingQR(true);
    try {
      // Using QR Server API (free, no signup required)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
      
      // Verify the QR code loads successfully
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(qrUrl);
        img.onerror = () => reject(new Error('Failed to generate QR code'));
        img.src = qrUrl;
      });
    } finally {
      setIsGeneratingQR(false);
    }
  }, []);

  // Generate shareable link
  const generateShareableLink = useCallback((): string => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      id: itinerary.id,
      title: itinerary.title,
      destination: itinerary.destination,
      dates: `${itinerary.dates.start}_${itinerary.dates.end}`,
    });
    return `${baseUrl}/shared-itinerary?${params.toString()}`;
  }, [itinerary]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }, []);

  // Print functionality
  const handlePrint = useCallback(async () => {
    try {
      // Generate QR code for the itinerary
      const shareLink = generateShareableLink();
      const qrCode = await generateQRCode(shareLink);
      setQrCodeData(qrCode);

      // Create print content with QR code
      const printContent = createPrintContent(itinerary, qrCode);
      
      // Create invisible iframe for printing
      const frame = document.createElement('iframe');
      frame.style.position = 'absolute';
      frame.style.top = '-1000px';
      frame.style.left = '-1000px';
      frame.style.width = '1px';
      frame.style.height = '1px';
      document.body.appendChild(frame);

      const doc = frame.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printContent);
        doc.close();

        // Wait for content to load, then print
        setTimeout(() => {
          frame.contentWindow?.print();
          document.body.removeChild(frame);
        }, 500);
      }

      onShare?.('print', true);
    } catch (error) {
      console.error('Print failed:', error);
      onShare?.('print', false);
    }
  }, [itinerary, generateQRCode, generateShareableLink, onShare]);

  // Print preview
  const handlePrintPreview = useCallback(async () => {
    const shareLink = generateShareableLink();
    const qrCode = await generateQRCode(shareLink);
    setQrCodeData(qrCode);
    setShowPreview(true);
  }, [generateQRCode, generateShareableLink]);

  // PDF export (using browser's print to PDF)
  const handlePDFExport = useCallback(async () => {
    setIsGeneratingPDF(true);
    try {
      // Show print dialog with save as PDF option
      await handlePrint();
      onShare?.('pdf', true);
    } catch (error) {
      console.error('PDF export failed:', error);
      onShare?.('pdf', false);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [handlePrint, onShare]);

  // Email sharing
  const handleEmailShare = useCallback(() => {
    const shareLink = generateShareableLink();
    const subject = encodeURIComponent(`Travel Itinerary: ${itinerary.title}`);
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to share my travel itinerary for ${itinerary.destination} with you.\n\n` +
      `Dates: ${itinerary.dates.start} to ${itinerary.dates.end}\n` +
      `Travelers: ${itinerary.travelers}\n\n` +
      `View the full itinerary here: ${shareLink}\n\n` +
      `Safe travels!\n\n` +
      `Sent via TripNav Travel Itinerary Builder`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onShare?.('email', true);
  }, [itinerary, generateShareableLink, onShare]);

  // Social media sharing
  const handleSocialShare = useCallback((platform: string) => {
    const shareLink = generateShareableLink();
    const text = `Check out my travel itinerary for ${itinerary.destination}!`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareLink}`)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.(platform, true);
  }, [itinerary, generateShareableLink, onShare]);

  // Copy link
  const handleCopyLink = useCallback(async () => {
    const shareLink = generateShareableLink();
    const success = await copyToClipboard(shareLink);
    onShare?.('copy', success);
  }, [generateShareableLink, copyToClipboard, onShare]);

  // QR Code share
  const handleQRShare = useCallback(async () => {
    try {
      const shareLink = generateShareableLink();
      const qrCode = await generateQRCode(shareLink);
      setQrCodeData(qrCode);
      
      // Open QR code in new window for sharing/saving
      const qrWindow = window.open('', '_blank', 'width=300,height=350');
      if (qrWindow) {
        qrWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${itinerary.title}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                img { border: 1px solid #ddd; border-radius: 8px; }
                .info { margin-top: 15px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <h3>${itinerary.title}</h3>
              <img src="${qrCode}" alt="QR Code" />
              <div class="info">
                Scan to view itinerary<br>
                Right-click to save image
              </div>
            </body>
          </html>
        `);
        qrWindow.document.close();
      }
      
      onShare?.('qr', true);
    } catch (error) {
      console.error('QR code generation failed:', error);
      onShare?.('qr', false);
    }
  }, [itinerary, generateQRCode, generateShareableLink, onShare]);

  // Share options configuration
  const shareOptions: ShareOption[] = [
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: 'text-blue-600',
      action: handleEmailShare,
    },
    {
      id: 'copy',
      label: copySuccess ? 'Copied!' : 'Copy Link',
      icon: copySuccess ? Check : Copy,
      color: copySuccess ? 'text-green-600' : 'text-gray-600',
      action: handleCopyLink,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      action: () => handleSocialShare('whatsapp'),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      color: 'text-blue-700',
      action: () => handleSocialShare('facebook'),
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      color: 'text-blue-500',
      action: () => handleSocialShare('twitter'),
    },
    {
      id: 'qr',
      label: isGeneratingQR ? 'Generating...' : 'QR Code',
      icon: QrCode,
      color: 'text-purple-600',
      action: handleQRShare,
    },
  ];

  // Render different variants
  const renderButtons = () => (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-tripnav-navy text-white rounded-md hover:bg-tripnav-orange transition-colors"
      >
        <Printer className="w-4 h-4" />
        {showLabels && <span>Print</span>}
      </button>
      
      <button
        onClick={handlePrintPreview}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
      >
        <Eye className="w-4 h-4" />
        {showLabels && <span>Preview</span>}
      </button>

      <button
        onClick={handlePDFExport}
        disabled={isGeneratingPDF}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {showLabels && <span>{isGeneratingPDF ? 'Generating...' : 'PDF'}</span>}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-tripnav-orange text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {showLabels && <span>Share</span>}
        </button>

        {showShareMenu && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  option.action();
                  setShowShareMenu(false);
                }}
                disabled={option.id === 'qr' && isGeneratingQR}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
              >
                <option.icon className={cn('w-4 h-4', option.color)} />
                <span className="text-gray-700">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors',
          className
        )}
      >
        <Share2 className="w-4 h-4" />
        {showLabels && <span>Actions</span>}
      </button>

      {showShareMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              handlePrint();
              setShowShareMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">Print</span>
          </button>
          
          <button
            onClick={() => {
              handlePrintPreview();
              setShowShareMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">Preview</span>
          </button>

          <button
            onClick={() => {
              handlePDFExport();
              setShowShareMenu(false);
            }}
            disabled={isGeneratingPDF}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">{isGeneratingPDF ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>

          <hr className="my-1" />

          {shareOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                option.action();
                setShowShareMenu(false);
              }}
              disabled={option.id === 'qr' && isGeneratingQR}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors last:rounded-b-lg disabled:opacity-50"
            >
              <option.icon className={cn('w-4 h-4', option.color)} />
              <span className="text-gray-700">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderToolbar = () => (
    <div className={cn('flex items-center gap-1 p-2 bg-gray-50 rounded-lg', className)}>
      <button
        onClick={handlePrint}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title="Print"
      >
        <Printer className="w-4 h-4" />
      </button>
      
      <button
        onClick={handlePrintPreview}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title="Preview"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        onClick={handlePDFExport}
        disabled={isGeneratingPDF}
        className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
        title="Export PDF"
      >
        <Download className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {shareOptions.slice(0, 3).map((option) => (
        <button
          key={option.id}
          onClick={option.action}
          disabled={option.id === 'qr' && isGeneratingQR}
          className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          title={option.label}
        >
          <option.icon className={cn('w-4 h-4', option.color)} />
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="More options"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {showShareMenu && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {shareOptions.slice(3).map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  option.action();
                  setShowShareMenu(false);
                }}
                disabled={option.id === 'qr' && isGeneratingQR}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
              >
                <option.icon className={cn('w-4 h-4', option.color)} />
                <span className="text-sm text-gray-700">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu && !(event.target as Element).closest('.relative')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  return (
    <>
      {variant === 'buttons' && renderButtons()}
      {variant === 'dropdown' && renderDropdown()}
      {variant === 'toolbar' && renderToolbar()}

      {/* Print Preview Modal */}
      {showPreview && (
        <PrintPreviewModal
          itinerary={itinerary}
          qrCode={qrCodeData}
          onClose={() => setShowPreview(false)}
          onPrint={handlePrint}
        />
      )}
    </>
  );
};

// Print Preview Modal Component
const PrintPreviewModal: React.FC<{
  itinerary: ItineraryData;
  qrCode: string | null;
  onClose: () => void;
  onPrint: () => void;
}> = ({ itinerary, qrCode, onClose, onPrint }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Print Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-tripnav-navy text-white rounded-md hover:bg-tripnav-orange transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 touch-target" />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-100px)]">
          <div 
            className="print-preview-content"
            dangerouslySetInnerHTML={{ 
              __html: createPrintContent(itinerary, qrCode || '')
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Function to create print HTML content
function createPrintContent(itinerary: ItineraryData, qrCode: string): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'meal': return '🍽️';
      case 'transport': return '🚗';
      default: return '📍';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${itinerary.title} - Travel Itinerary</title>
      <style>
        ${getInlinePrintStyles()}
      </style>
    </head>
    <body>
      <!-- Print Header -->
      <div class="print-header">
        <h1>${itinerary.title}</h1>
        <div class="trip-info">
          ${itinerary.destination} • ${formatDate(itinerary.dates.start)} - ${formatDate(itinerary.dates.end)} • ${itinerary.travelers} ${itinerary.travelers === 1 ? 'Traveler' : 'Travelers'}
        </div>
      </div>

      <!-- Daily Itinerary -->
      ${itinerary.days.map((day, index) => `
        <div class="day-section ${index > 0 ? 'page-break' : ''}">
          <div class="day-header">
            <h2>Day ${index + 1} - ${formatDate(day.date)}</h2>
          </div>
          
          ${day.activities.map(activity => `
            <div class="activity-card">
              <div class="time">${activity.time}</div>
              <div class="title">${getActivityIcon(activity.type)} ${activity.title}</div>
              <div class="description">${activity.description}</div>
              <div class="location">📍 ${activity.location}</div>
              ${activity.status ? `<div class="status-${activity.status}">${activity.status.toUpperCase()}</div>` : ''}
              ${activity.confirmationNumber ? `<div class="confirmation">Confirmation: ${activity.confirmationNumber}</div>` : ''}
              ${activity.notes ? `<div class="notes">${activity.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}

      <!-- Emergency Contacts -->
      ${itinerary.contacts && itinerary.contacts.length > 0 ? `
        <div class="emergency-contacts page-break">
          <h3>Emergency Contacts</h3>
          ${itinerary.contacts.map(contact => `
            <div class="contact-item">
              <strong>${contact.name}</strong> (${contact.type})<br>
              📞 ${contact.phone}<br>
              ${contact.email ? `📧 ${contact.email}` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Important Notes -->
      ${itinerary.notes && itinerary.notes.length > 0 ? `
        <div class="page-break">
          <h3>Important Notes</h3>
          ${itinerary.notes.map(note => `
            <div class="important-note">${note}</div>
          `).join('')}
        </div>
      ` : ''}

      <!-- QR Code -->
      ${qrCode ? `
        <div class="qr-code-section">
          <img src="${qrCode}" alt="QR Code" />
          <div>Scan for digital copy</div>
        </div>
      ` : ''}

      <!-- Print Footer -->
      <div class="print-footer">
        Generated on ${new Date().toLocaleDateString()} via TripNav Travel Itinerary Builder
      </div>
    </body>
    </html>
  `;
}

// Inline print styles for the print content
function getInlinePrintStyles(): string {
  // Return a minified version of our print styles
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; color: #000; }
    .print-header { border-bottom: 2pt solid #1f5582; margin-bottom: 20pt; padding-bottom: 10pt; }
    .print-header h1 { font-size: 24pt; font-weight: bold; color: #1f5582; }
    .print-header .trip-info { font-size: 11pt; color: #333; margin-top: 5pt; }
    .page-break { page-break-before: always; }
    .day-section { margin-bottom: 20pt; border: 1pt solid #ddd; padding: 15pt; border-radius: 8pt; page-break-inside: avoid; }
    .day-header { border-bottom: 1pt solid #1f5582; padding-bottom: 8pt; margin-bottom: 15pt; }
    .day-header h2 { font-size: 18pt; font-weight: bold; color: #1f5582; }
    .activity-card { margin-bottom: 15pt; padding: 10pt; border: 1pt solid #e5e5e5; border-radius: 6pt; page-break-inside: avoid; }
    .activity-card .time { font-weight: bold; font-size: 11pt; color: #1f5582; }
    .activity-card .title { font-size: 14pt; font-weight: bold; margin: 3pt 0; }
    .activity-card .description { font-size: 10pt; color: #333; line-height: 1.3; }
    .activity-card .location { font-size: 9pt; color: #666; font-style: italic; }
    .status-confirmed { background: #d4edda; color: #155724; padding: 2pt 6pt; border-radius: 3pt; font-size: 9pt; }
    .status-pending { background: #fff3cd; color: #856404; padding: 2pt 6pt; border-radius: 3pt; font-size: 9pt; }
    .emergency-contacts { border: 2pt solid #dc3545; padding: 15pt; background: #fff5f5; }
    .emergency-contacts h3 { color: #dc3545; font-size: 16pt; margin-bottom: 10pt; }
    .contact-item { margin-bottom: 8pt; font-size: 11pt; }
    .important-note { border: 2pt solid #ffc107; background: #fffdf0; padding: 10pt; margin: 10pt 0; border-radius: 6pt; }
    .qr-code-section { position: fixed; bottom: 20pt; right: 20pt; width: 80pt; text-align: center; font-size: 8pt; color: #666; }
    .qr-code-section img { width: 60pt; height: 60pt; border: 1pt solid #ddd; }
    .print-footer { position: fixed; bottom: 10pt; left: 20pt; right: 100pt; font-size: 8pt; color: #666; border-top: 1pt solid #ddd; padding-top: 5pt; }
    @page { margin: 0.75in; size: letter; }
  `;
}

export default PrintShareActions; 