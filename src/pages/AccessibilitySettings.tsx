import React from 'react';
import { AccessibilityControlPanel } from '../components/accessibility/AccessibilityControlPanel';

export function AccessibilitySettings() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accessibility Settings</h1>
          <p className="text-gray-600 mt-2">Configure advanced accessibility features including voice navigation, eye tracking, and motor assistance.</p>
        </div>
        
        <AccessibilityControlPanel />
      </div>
    </div>
  );
}

export default AccessibilitySettings;