import React from 'react';
import { NotificationCenter as NotificationCenterComponent } from '../components/notifications/NotificationCenter';

export function NotificationCenter() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-2">Manage your mental health reminders, crisis alerts, and personalized notifications.</p>
        </div>
        
        <NotificationCenterComponent />
      </div>
    </div>
  );
}

export default NotificationCenter;