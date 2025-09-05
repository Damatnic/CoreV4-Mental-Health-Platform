import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TherapistProfile } from './TherapistProfile';

describe('TherapistProfile', () => {
  const mockOnBookAppointment = vi.fn();
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    therapistId: 'test-therapist-123',
    onBookAppointment: mockOnBookAppointment,
    _onClose: mockOnClose
  };

  it('renders loading state initially', () => {
    render(<TherapistProfile {...defaultProps} />);
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeTruthy();
  });

  it('renders therapist information after loading', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Check key information is displayed
    expect(screen.getByText('Licensed Clinical Psychologist')).toBeTruthy();
    expect(screen.getByText('Anxiety Disorders')).toBeTruthy();
    expect(screen.getByText('Trauma & PTSD')).toBeTruthy();
    expect(screen.getByText('Depression')).toBeTruthy();
  });

  it('switches between tabs correctly', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Click on Reviews tab
    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);
    
    // Check that reviews content is displayed
    expect(screen.getByText('Review Summary')).toBeTruthy();
    
    // Click on Credentials tab
    const credentialsTab = screen.getByText('Credentials');
    fireEvent.click(credentialsTab);
    
    // Check that credentials content is displayed
    expect(screen.getByText('Education')).toBeTruthy();
    expect(screen.getByText('Ph.D. in Clinical Psychology')).toBeTruthy();
    
    // Click on Availability tab
    const availabilityTab = screen.getByText('Availability');
    fireEvent.click(availabilityTab);
    
    // Check that availability content is displayed
    expect(screen.getByText('Regular Hours')).toBeTruthy();
    expect(screen.getByText('Monday')).toBeTruthy();
  });

  it('calls onBookAppointment when booking button is clicked', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Find and click the Book Appointment button
    const bookButtons = screen.getAllByText('Book Appointment');
    fireEvent.click(bookButtons[0]);
    
    // Check that the callback was called
    expect(mockOnBookAppointment).toHaveBeenCalled();
  });

  it('displays correct pricing information', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Check pricing is displayed
    expect(screen.getByText('$180')).toBeTruthy();
    expect(screen.getByText('per session')).toBeTruthy();
    expect(screen.getByText('Sliding scale available')).toBeTruthy();
  });

  it('displays insurance information correctly', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Check insurance providers are displayed
    expect(screen.getByText('Blue Cross Blue Shield')).toBeTruthy();
    expect(screen.getByText('Aetna')).toBeTruthy();
    expect(screen.getByText('United Healthcare')).toBeTruthy();
  });

  it('displays contact information', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Check contact info is displayed
    expect(screen.getByText('(555) 123-4567')).toBeTruthy();
    expect(screen.getByText('dr.chen@example.com')).toBeTruthy();
  });

  it('handles video player controls', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Find video controls (Play button should be visible initially)
    const playButton = document.querySelector('[aria-label*="play" i], button svg.lucide-play')?.closest('button');
    
    if (playButton) {
      fireEvent.click(playButton);
      
      // After clicking, pause button should be visible
      const pauseButton = document.querySelector('[aria-label*="pause" i], button svg.lucide-pause')?.closest('button');
      expect(pauseButton).toBeTruthy();
    }
  });

  it('displays specialty areas with experience', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Check specialty areas
    expect(screen.getByText('10+ years')).toBeTruthy();
    expect(screen.getByText('8+ years')).toBeTruthy();
    expect(screen.getByText('12+ years')).toBeTruthy();
  });

  it('displays badges and certifications', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Check badges
    expect(screen.getByText('EMDR Certified')).toBeTruthy();
    expect(screen.getByText('Trauma Specialist')).toBeTruthy();
    expect(screen.getByText('LGBTQ+ Affirming')).toBeTruthy();
  });

  it('displays reviews with ratings', async () => {
    render(<TherapistProfile {...defaultProps} />);
    
    // Wait for component to load
    await screen.findByText('Dr. Sarah Chen, PhD', { exact: false });
    
    // Click on Reviews tab
    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);
    
    // Check reviews are displayed
    expect(screen.getByText('Sarah M.')).toBeTruthy();
    expect(screen.getByText('Michael R.')).toBeTruthy();
    expect(screen.getByText('Jennifer L.')).toBeTruthy();
  });
});