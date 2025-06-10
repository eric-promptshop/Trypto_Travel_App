import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIRequestFormEnhanced } from '@/components/ai-request-form-enhanced';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('AIRequestFormEnhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'AI response', suggestions: [] }),
    });
  });

  it('renders the AI chat interface', () => {
    render(<AIRequestFormEnhanced />);
    
    expect(screen.getByText(/Hi! I'm your AI travel assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholder(/Tell me about your dream trip/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
  });

  it('handles user input and sends messages', async () => {
    const user = userEvent.setup();
    render(<AIRequestFormEnhanced />);
    
    const input = screen.getByPlaceholder(/Tell me about your dream trip/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    await user.type(input, 'I want to visit Peru for 7 days');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/form-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I want to visit Peru for 7 days',
          context: expect.any(Object),
        }),
      });
    });
  });

  it('displays AI responses in the chat', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Great choice! Peru offers amazing cultural and adventure experiences.',
        suggestions: ['Machu Picchu', 'Sacred Valley', 'Amazon Rainforest'],
      }),
    });

    const user = userEvent.setup();
    render(<AIRequestFormEnhanced />);
    
    const input = screen.getByPlaceholder(/Tell me about your dream trip/i);
    await user.type(input, 'Peru trip');
    await user.click(screen.getByRole('button', { name: /Send/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Great choice! Peru offers/i)).toBeInTheDocument();
    });
  });

  it('handles form data extraction', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'I understand you want to visit Peru.',
          extractedData: {
            destination: 'Peru',
            duration: 7,
            travelers: 2,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          extractedData: {
            destination: 'Peru',
            duration: 7,
            travelers: 2,
            startDate: '2024-06-15',
            budget: 3000,
          },
        }),
      });

    const user = userEvent.setup();
    render(<AIRequestFormEnhanced />);
    
    const input = screen.getByPlaceholder(/Tell me about your dream trip/i);
    await user.type(input, '7 days in Peru for 2 people');
    await user.click(screen.getByRole('button', { name: /Send/i }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/extract-form-data', expect.any(Object));
    });
  });

  it('shows loading state during AI processing', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    (global.fetch as jest.Mock).mockReturnValueOnce(promise);
    
    const user = userEvent.setup();
    render(<AIRequestFormEnhanced />);
    
    await user.type(screen.getByPlaceholder(/Tell me about your dream trip/i), 'Test');
    await user.click(screen.getByRole('button', { name: /Send/i }));
    
    expect(screen.getByText(/AI is thinking/i)).toBeInTheDocument();
    
    resolvePromise!({
      ok: true,
      json: async () => ({ message: 'Response' }),
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/AI is thinking/i)).not.toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const user = userEvent.setup();
    render(<AIRequestFormEnhanced />);
    
    await user.type(screen.getByPlaceholder(/Tell me about your dream trip/i), 'Test');
    await user.click(screen.getByRole('button', { name: /Send/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/i)).toBeInTheDocument();
    });
  });

  it('handles trip generation when form is complete', async () => {
    const mockRouter = { push: jest.fn() };
    jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Generating your itinerary...',
          extractedData: {
            destination: 'Peru',
            duration: 7,
            travelers: 2,
            startDate: '2024-06-15',
            budget: 3000,
            interests: ['adventure', 'culture'],
          },
          isComplete: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'trip-123',
          itinerary: { /* mock itinerary data */ },
        }),
      });

    const user = userEvent.setup();
    render(<AIRequestFormEnhanced />);
    
    const input = screen.getByPlaceholder(/Tell me about your dream trip/i);
    await user.type(input, 'Complete trip details provided');
    await user.click(screen.getByRole('button', { name: /Send/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Generating your personalized itinerary/i)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/trips/trip-123');
    });
  });

  it('supports voice input when available', async () => {
    // Mock speech recognition
    const mockSpeechRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn(),
    };
    
    (window as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
    
    render(<AIRequestFormEnhanced />);
    
    const voiceButton = screen.getByRole('button', { name: /Start voice input/i });
    expect(voiceButton).toBeInTheDocument();
    
    fireEvent.click(voiceButton);
    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });
});