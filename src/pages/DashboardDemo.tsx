import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConsoleDashboard } from '../components/dashboard/console/ConsoleDashboard';

/**
 * Dashboard Demo Page
 * 
 * Showcases the new expandable dashboard tiles with contextual mental health options.
 * Each tile expands to reveal quick-access actions relevant to that feature area.
 */
export function DashboardDemo() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ConsoleDashboard />
        
        {/* Demo Instructions Overlay */}
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 
                        bg-gray-800/95 backdrop-blur-lg border border-gray-700 
                        rounded-xl p-4 shadow-2xl z-50">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center">
            <span className="mr-2">💡</span> Try the Expandable Tiles!
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Click/Tap</strong> any dashboard tile to expand it</li>
            <li>• <strong>Crisis tile</strong> shows emergency contacts & hotlines</li>
            <li>• <strong>Wellness tile</strong> reveals mood tracking & meditation</li>
            <li>• <strong>Community tile</strong> opens peer support options</li>
            <li>• <strong>Professional tile</strong> shows therapist booking</li>
            <li>• <strong>Mobile optimized</strong> with haptic feedback</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">ESC</kbd> or 
              tap outside to close expanded tiles
            </p>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default DashboardDemo;