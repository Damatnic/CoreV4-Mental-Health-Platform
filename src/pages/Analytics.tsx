import React from 'react';
import { MentalHealthAnalyticsDashboard } from '../components/analytics/MentalHealthAnalyticsDashboard';

export function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mental Health Analytics</h1>
          <p className="text-gray-600 mt-2">Track your wellness journey with comprehensive insights and progress visualization.</p>
        </div>
        
        <MentalHealthAnalyticsDashboard />
      </div>
    </div>
  );
}

export default Analytics;