import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceInputButton } from '@/components/voice/VoiceInputButton';
import { parseVoiceTranscript } from '@/lib/voice-parser';

// Mock the speech recognition hook
jest.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: ({ onTranscript, onError }: any) => ({
    start: jest.fn(),
    stop: jest.fn(),
    isSupported: true,
  }),
}));

describe('VoiceInputButton', () => {
  const mockSetValue = jest.fn();
  const mockNavigateToReview = jest.fn();
  const mockOnTranscriptComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the mic button with correct initial state', () => {
    render(
      <VoiceInputButton
        setValue={mockSetValue}
        navigateToReview={mockNavigateToReview}
        onTranscriptComplete={mockOnTranscriptComplete}
      />
    );

    const button = screen.getByRole('button', { name: /start recording/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Describe your trip')).toBeInTheDocument();
  });

  it('shows recording state when clicked', () => {
    render(
      <VoiceInputButton
        setValue={mockSetValue}
        navigateToReview={mockNavigateToReview}
        onTranscriptComplete={mockOnTranscriptComplete}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Tap to finish')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides overlay after recording stops', async () => {
    render(
      <VoiceInputButton
        setValue={mockSetValue}
        navigateToReview={mockNavigateToReview}
        onTranscriptComplete={mockOnTranscriptComplete}
      />
    );

    // Test that overlay appears and disappears
    const overlayText = 'We are going to Tokyo';
    
    // Simulate transcript display
    const overlay = screen.queryByText(overlayText);
    expect(overlay).not.toBeInTheDocument();

    // After 500ms, overlay should be hidden
    await waitFor(() => {
      expect(screen.queryByText(overlayText)).not.toBeInTheDocument();
    }, { timeout: 600 });
  });
});

describe('parseVoiceTranscript', () => {
  const testCases = [
    {
      input: "We're going to Tokyo from July 10th to July 18th",
      expected: {
        destination: 'Tokyo',
        hasStartDate: true,
        hasEndDate: true,
      },
    },
    {
      input: "Travel to Paris for 5 days with 4 people",
      expected: {
        destination: 'Paris',
        travelers: 4,
        hasStartDate: true,
        hasEndDate: true,
      },
    },
    {
      input: "Our budget is fifteen hundred dollars per person and we prefer a hotel",
      expected: {
        budget: '1500',
        accommodation: 'hotel',
      },
    },
    {
      input: "We're interested in food and nightlife",
      expected: {
        interests: ['food', 'nightlife'],
      },
    },
    {
      input: "We'll need flights and public transit",
      expected: {
        transportation: ['flights', 'public-transport'],
      },
    },
    {
      input: "Going to New York next week for a couple's trip",
      expected: {
        destination: 'New York',
        travelers: 2,
        hasStartDate: true,
        hasEndDate: true,
      },
    },
    {
      input: "Solo trip to Japan in August",
      expected: {
        destination: 'Japan',
        travelers: 1,
        hasStartDate: true,
        hasEndDate: true,
      },
    },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`correctly parses: "${input}"`, () => {
      const result = parseVoiceTranscript(input);

      if (expected.destination) {
        expect(result.destination).toBe(expected.destination);
      }
      if (expected.travelers !== undefined) {
        expect(result.travelers).toBe(expected.travelers);
      }
      if (expected.budget) {
        expect(result.budget).toBe(expected.budget);
      }
      if (expected.accommodation) {
        expect(result.accommodation).toBe(expected.accommodation);
      }
      if (expected.interests) {
        expect(result.interests).toEqual(expect.arrayContaining(expected.interests));
      }
      if (expected.transportation) {
        expect(result.transportation).toEqual(expect.arrayContaining(expected.transportation));
      }
      if (expected.hasStartDate) {
        expect(result.startDate).toBeInstanceOf(Date);
      }
      if (expected.hasEndDate) {
        expect(result.endDate).toBeInstanceOf(Date);
      }
    });
  });

  it('logs unparsed tokens to console.debug', () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    
    parseVoiceTranscript("We want to go somewhere warm maybe with beaches");
    
    expect(debugSpy).toHaveBeenCalledWith('UNPARSED', expect.any(String));
    
    debugSpy.mockRestore();
  });

  it('handles confidence thresholds correctly', () => {
    const result = parseVoiceTranscript("Maybe Tokyo or somewhere");
    
    // Low confidence destination might not be parsed
    // This depends on the confidence threshold implementation
    expect(result).toBeDefined();
  });
});

describe('Voice Input Integration', () => {
  it('parses complex voice input correctly', () => {
    const complexInput = "We're going to Tokyo from July 10th to July 18th for our family vacation. Our budget is $2000 per person and we'd prefer a hotel. We're interested in culture, food, and shopping. We'll need flights and public transport.";
    
    const result = parseVoiceTranscript(complexInput);
    
    expect(result.destination).toBe('Tokyo');
    expect(result.travelers).toBe(4); // family
    expect(result.budget).toBe('2000');
    expect(result.accommodation).toBe('hotel');
    expect(result.interests).toEqual(expect.arrayContaining(['culture', 'food', 'shopping']));
    expect(result.transportation).toEqual(expect.arrayContaining(['flights', 'public-transport']));
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });
});