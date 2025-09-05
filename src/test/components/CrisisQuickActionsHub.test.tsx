import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CrisisQuickActionsHub } from '../../components/dashboard/widgets/quickActions/CrisisQuickActionsHub';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../hooks/useCrisisAssessment', () => ({
  useCrisisAssessment: () => ({
    assessmentData: {
      overallRisk: 5,
      moodScore: 6,
      thoughtScore: 5,
      behaviorScore: 4
    },
    isAssessing: false,
    updateAssessment: jest.fn()
  })
}));

jest.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }
    },
    error: null,
    loading: false
  })
}));

describe('CrisisQuickActionsHub', () => {
  const mockOnActionTaken = jest.fn();
  const mockEmergencyContacts = [
    {
      id: '1',
      name: 'Crisis Buddy',
      phone: '555-0123',
      relationship: 'Friend',
      isAvailable: true,
      isPrimary: true
    }
  ];
  const mockSafetyPlan = {
    warningSignals: ['Feeling overwhelmed', 'Isolation thoughts'],
    copingStrategies: ['Deep breathing', 'Call a friend'],
    safetyContacts: mockEmergencyContacts,
    professionalContacts: [],
    safeLocations: ['Home', 'Friend\'s house'],
    reasonsToLive: ['Family', 'Future goals']
  };

  beforeEach(() => {
    mockOnActionTaken.mockClear();
    // Mock window.location for tel: and sms: links
    delete window.location;
    window.location = { href: '' } as any;
  });

  test('renders crisis support hub with emergency hotlines', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    expect(screen.getByText('Crisis Support Hub')).toBeInTheDocument();
    expect(screen.getByText('988 Suicide & Crisis Lifeline')).toBeInTheDocument();
    expect(screen.getByText('Crisis Text Line')).toBeInTheDocument();
    expect(screen.getByText('Emergency Services')).toBeInTheDocument();
  });

  test('handles emergency call button click', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    const emergencyButton = screen.getByText('988 Suicide & Crisis Lifeline').closest('button');
    fireEvent.click(emergencyButton!);

    expect(window.location.href).toBe('tel:988');
    expect(mockOnActionTaken).toHaveBeenCalledWith('emergency_call', expect.objectContaining({
      number: '988',
      name: '988 Suicide & Crisis Lifeline'
    }));
  });

  test('handles crisis text button click', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    const textButton = screen.getByText('Crisis Text Line').closest('button');
    fireEvent.click(textButton!);

    expect(window.location.href).toBe('sms:741741?body=HOME');
    expect(mockOnActionTaken).toHaveBeenCalledWith('crisis_text', expect.objectContaining({
      number: '741741'
    }));
  });

  test('displays emergency contacts when provided', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
        emergencyContacts={mockEmergencyContacts}
      />
    );

    expect(screen.getByText('Crisis Buddy')).toBeInTheDocument();
    expect(screen.getByText('Friend')).toBeInTheDocument();
  });

  test('toggles safety plan visibility', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
        safetyPlan={mockSafetyPlan}
      />
    );

    const safetyPlanButton = screen.getByText('Safety Plan').closest('button');
    fireEvent.click(safetyPlanButton!);

    // Check if safety plan content is visible
    expect(screen.getByText('Warning Signals')).toBeInTheDocument();
    expect(screen.getByText('Feeling overwhelmed')).toBeInTheDocument();
  });

  test('opens grounding exercise modal', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    const groundingButton = screen.getByText('Grounding');
    fireEvent.click(groundingButton);

    waitFor(() => {
      expect(screen.getByText('5-4-3-2-1 Grounding Exercise')).toBeInTheDocument();
    });
  });

  test('opens breathing exercise overlay', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    const breathingButton = screen.getByText('Breathe');
    fireEvent.click(breathingButton);

    waitFor(() => {
      expect(screen.getByText(/inhale/i)).toBeInTheDocument();
    });
  });

  test('handles location sharing', async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve())
      }
    });

    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    const locationButton = screen.getByText('Share Emergency Location').closest('button');
    fireEvent.click(locationButton!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(mockOnActionTaken).toHaveBeenCalledWith('location_shared', expect.objectContaining({
        location: expect.objectContaining({
          coords: expect.objectContaining({
            latitude: 40.7128,
            longitude: -74.0060
          })
        })
      }));
    });
  });

  test('displays offline mode indicator when offline', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
  });

  test('applies correct crisis level color based on assessment', () => {
    render(
      <CrisisQuickActionsHub 
        _userId="test-user"
        onActionTaken={mockOnActionTaken}
      />
    );

    const header = screen.getByText('Crisis Support Hub').closest('div');
    // With overallRisk of 5, it should have yellow color (moderate)
    expect(header?.parentElement?.className).toContain('yellow');
  });
});