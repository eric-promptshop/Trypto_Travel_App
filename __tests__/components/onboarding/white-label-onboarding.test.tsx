import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhiteLabelOnboarding } from '@/components/onboarding/WhiteLabelOnboarding';
import { OnboardingProvider } from '@/contexts/onboarding-context';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock API calls
global.fetch = jest.fn();

// Helper to render with context
const renderWithContext = (component: React.ReactElement) => {
  return render(
    <OnboardingProvider>
      {component}
    </OnboardingProvider>
  );
};

describe('WhiteLabelOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('renders the welcome screen initially', () => {
    renderWithContext(<WhiteLabelOnboarding />);
    
    expect(screen.getByText(/Welcome to Your White-Label Journey/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
  });

  it('progresses through onboarding steps', async () => {
    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Welcome screen
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    
    // Company Profile screen
    await waitFor(() => {
      expect(screen.getByText(/Tell us about your company/i)).toBeInTheDocument();
    });
    
    // Fill company details
    await user.type(screen.getByLabelText(/Company Name/i), 'Adventure Tours Inc');
    await user.type(screen.getByLabelText(/Website/i), 'https://adventuretours.com');
    await user.type(screen.getByLabelText(/Phone Number/i), '+1-555-0123');
    
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Branding screen
    await waitFor(() => {
      expect(screen.getByText(/Customize your brand/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Navigate to company profile
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    
    // Try to continue without filling required fields
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Company name is required/i)).toBeInTheDocument();
    });
  });

  it('handles AI-powered company description generation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        description: 'Adventure Tours Inc specializes in creating unforgettable travel experiences...',
      }),
    });

    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Navigate to company profile
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    
    await user.type(screen.getByLabelText(/Company Name/i), 'Adventure Tours Inc');
    await user.click(screen.getByRole('button', { name: /Generate Description/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Adventure Tours Inc specializes/i)).toBeInTheDocument();
    });
  });

  it('handles logo upload', async () => {
    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Navigate to company profile
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Upload Logo/i);
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByAltText(/Company logo/i)).toBeInTheDocument();
    });
  });

  it('saves progress between steps', async () => {
    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Navigate and fill company profile
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    await user.type(screen.getByLabelText(/Company Name/i), 'Test Company');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Go back
    await user.click(screen.getByRole('button', { name: /Back/i }));
    
    // Verify data is preserved
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
  });

  it('handles theme customization with AI', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        colors: {
          primary: '#1E40AF',
          secondary: '#7C3AED',
          accent: '#F59E0B',
        },
        suggestions: ['Modern', 'Professional', 'Trustworthy'],
      }),
    });

    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Navigate to branding step
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    await user.type(screen.getByLabelText(/Company Name/i), 'Test');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Use AI for theme generation
    await user.click(screen.getByRole('button', { name: /Generate Theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Modern/i)).toBeInTheDocument();
      expect(screen.getByText(/Professional/i)).toBeInTheDocument();
    });
  });

  it('completes onboarding and deploys platform', async () => {
    const mockRouter = { push: jest.fn() };
    jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter);
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true,
        platformUrl: 'https://testcompany.tripnav.io',
      }),
    });

    const user = userEvent.setup();
    renderWithContext(<WhiteLabelOnboarding />);
    
    // Speed through all steps (simplified for test)
    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    
    // Mock completing all steps
    const completeButton = await screen.findByRole('button', { name: /Skip to Review/i });
    await user.click(completeButton);
    
    // Launch platform
    await user.click(screen.getByRole('button', { name: /Launch Platform/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Deployment in progress/i)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/admin');
    });
  });
});