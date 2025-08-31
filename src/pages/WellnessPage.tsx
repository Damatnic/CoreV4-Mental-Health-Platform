import React, { useState } from 'react';
import { WellnessToolsSuite } from '../components/wellness/WellnessToolsSuite';

export function WellnessPage() {
  const [showFullSuite, setShowFullSuite] = useState(false);

  // If full suite is active, render it
  if (showFullSuite) {
    return (
      <div className="h-screen">
        <WellnessToolsSuite 
          initialTool="dashboard"
          showNavigation={true}
          compactMode={false}
        />
      </div>
    );
  }

  // Otherwise show the overview cards
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">
          Wellness Tools
        </h1>
        <button
          onClick={() => setShowFullSuite(true)}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Open Full Wellness Suite
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">🧘</div>
            <h2 className="card-title">Meditation</h2>
            <p className="card-description">Guided meditation sessions with timer</p>
          </div>
          <div className="card-content">
            <button 
              onClick={() => setShowFullSuite(true)}
              className="btn-primary w-full"
            >
              Start Session
            </button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">🌬️</div>
            <h2 className="card-title">Breathing Exercises</h2>
            <p className="card-description">Evidence-based breathing techniques</p>
          </div>
          <div className="card-content">
            <button 
              onClick={() => setShowFullSuite(true)}
              className="btn-primary w-full"
            >
              Begin Exercise
            </button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">📝</div>
            <h2 className="card-title">Therapeutic Journal</h2>
            <p className="card-description">CBT/DBT-based journaling</p>
          </div>
          <div className="card-content">
            <button 
              onClick={() => setShowFullSuite(true)}
              className="btn-primary w-full"
            >
              Write Entry
            </button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">💪</div>
            <h2 className="card-title">Wellness Dashboard</h2>
            <p className="card-description">Track all wellness metrics</p>
          </div>
          <div className="card-content">
            <button 
              onClick={() => setShowFullSuite(true)}
              className="btn-primary w-full"
            >
              View Dashboard
            </button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">😴</div>
            <h2 className="card-title">Sleep & Habits</h2>
            <p className="card-description">Track sleep and daily habits</p>
          </div>
          <div className="card-content">
            <button 
              onClick={() => setShowFullSuite(true)}
              className="btn-primary w-full"
            >
              Track Habits
            </button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">🎯</div>
            <h2 className="card-title">Mood Tracker</h2>
            <p className="card-description">Monitor emotional patterns</p>
          </div>
          <div className="card-content">
            <button 
              onClick={() => setShowFullSuite(true)}
              className="btn-primary w-full"
            >
              Track Mood
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">85/100</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">7 days</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Meditation</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">120 min</p>
            </div>
            <div className="text-3xl">🧘</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Journal Entries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Default export for lazy loading
export default WellnessPage;
