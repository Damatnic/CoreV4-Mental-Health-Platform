// Screen Reader Service for accessibility
// Provides screen reader announcements and ARIA live region management

import { logger } from '../../utils/logger';

class ScreenReaderService {
  private static instance: ScreenReaderService;
  private liveRegion: HTMLElement | null = null;

  private constructor() {
    this.initializeLiveRegion();
  }

  static getInstance(): ScreenReaderService {
    if (!this.instance) {
      this.instance = new ScreenReaderService();
    }
    return this.instance;
  }

  private initializeLiveRegion(): void {
    // Create an ARIA live region for announcements
    if (typeof document !== 'undefined') {
      this.liveRegion = document.createElement('div');
      this.liveRegion.setAttribute('role', 'status');
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.className = 'sr-only'; // Visually hidden but accessible
      this.liveRegion.style.position = 'absolute';
      this.liveRegion.style.left = '-10000px';
      this.liveRegion.style.width = '1px';
      this.liveRegion.style.height = '1px';
      this.liveRegion.style.overflow = 'hidden';
      document.body.appendChild(this.liveRegion);
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) {
      logger.warn('Live region not initialized');
      return;
    }

    // Update the live region priority if needed
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear and set the message
    this.liveRegion.textContent = '';
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);

    logger.info(`Screen reader announcement: ${message}`, 'ScreenReaderService');
  }

  announceError(error: string): void {
    this.announce(`Error: ${error}`, 'assertive');
  }

  announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite');
  }

  announceNavigation(location: string): void {
    this.announce(`Navigated to ${location}`, 'polite');
  }

  announceUpdate(update: string): void {
    this.announce(update, 'polite');
  }

  cleanup(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }
}

export const screenReaderService = ScreenReaderService.getInstance();

// Export the announce function directly for convenience
export const announce = (message: string, priority?: 'polite' | 'assertive') => {
  screenReaderService.announce(message, priority);
};