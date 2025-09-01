/**
 * Profile Component - Placeholder for compilation
 * This component manages user profile information and preferences
 */

import React from 'react';

export interface ProfileProps {
  userId?: string;
  editable?: boolean;
}

export default function Profile({ userId, editable = true }: ProfileProps) {
  return (
    <div className="profile p-4">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-lg font-medium">JD</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">John Doe</h3>
              <p className="text-gray-600">Member since 2024</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                className="w-full p-2 border rounded" 
                defaultValue="john.doe@example.com"
                readOnly={!editable}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                defaultValue="John D."
                readOnly={!editable}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea 
                className="w-full p-2 border rounded" 
                rows={3}
                placeholder="Tell us a little about yourself..."
                readOnly={!editable}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Goals</label>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded">Improve daily mood tracking</div>
                <div className="p-2 bg-green-50 rounded">Practice mindfulness daily</div>
                <div className="p-2 bg-purple-50 rounded">Build healthy sleep routine</div>
              </div>
            </div>
          </div>
          
          {editable && (
            <div className="mt-6">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Profile };