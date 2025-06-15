import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Plus, MapPin, Calendar, Users, DollarSign, Hotel, Heart } from 'lucide-react';
import { parseVoiceTranscript, ParsedFields } from '@/lib/voice-parser';

interface VoicePreviewModalProps {
  isOpen: boolean;
  transcript: string;
  onConfirm: (fields: ParsedFields) => void;
  onAddMore: () => void;
  onClose: () => void;
}

const fieldIcons = {
  destination: MapPin,
  startDate: Calendar,
  endDate: Calendar,
  travelers: Users,
  budget: DollarSign,
  accommodation: Hotel,
  interests: Heart,
};

const fieldLabels = {
  destination: 'Destination',
  startDate: 'Start Date',
  endDate: 'End Date',
  travelers: 'Travelers',
  budget: 'Budget',
  accommodation: 'Accommodation',
  interests: 'Interests',
  specialRequests: 'Special Requests',
};

export function VoicePreviewModal({
  isOpen,
  transcript,
  onConfirm,
  onAddMore,
  onClose,
}: VoicePreviewModalProps) {
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && transcript) {
      setIsLoading(true);
      setTimeout(() => {
        const parsed = parseVoiceTranscript(transcript);
        setParsedFields(parsed);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, transcript]);

  const formatFieldValue = (key: string, value: any): string => {
    if (key === 'startDate' || key === 'endDate') {
      return value instanceof Date ? value.toLocaleDateString() : 'Not specified';
    }
    if (key === 'interests' && Array.isArray(value)) {
      return value.join(', ');
    }
    return value?.toString() || 'Not specified';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Your Trip Details</DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <p className="text-sm text-gray-600 mb-4">
            Here's what we understood from your description:
          </p>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {parsedFields && Object.entries(parsedFields).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                const Icon = fieldIcons[key as keyof typeof fieldIcons] || Heart;
                const label = fieldLabels[key as keyof typeof fieldLabels] || key;
                
                return (
                  <Card key={key} className="p-3">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="text-sm text-gray-900">
                          {formatFieldValue(key, value)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {transcript && (
                <Card className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Full transcript:</p>
                  <p className="text-sm text-gray-700 italic">"{transcript}"</p>
                </Card>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onAddMore}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add More Details
          </Button>
          <Button
            onClick={() => parsedFields && onConfirm(parsedFields)}
            disabled={isLoading || !parsedFields}
          >
            <Check className="h-4 w-4 mr-2" />
            Looks Good
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}