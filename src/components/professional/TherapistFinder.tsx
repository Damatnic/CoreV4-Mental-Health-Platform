/**
 * Therapist Finder Component - Placeholder for compilation
 * This component helps users find and connect with mental health professionals
 */

import React from 'react';

export interface TherapistFinderProps {
  location?: string;
  specialty?: string;
  insuranceAccepted?: string[];
}

export default function TherapistFinder({ location, specialty, insuranceAccepted }: TherapistFinderProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Find Professional Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with qualified mental health professionals who understand your needs
          </p>
        </div>
        
        {/* Search Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input 
                type="text" 
                placeholder="Enter your city or ZIP code" 
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={location}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specialty
              </label>
              <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Specialties</option>
                <option>Anxiety & Depression</option>
                <option>Trauma & PTSD</option>
                <option>Couples Therapy</option>
                <option>Family Therapy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance
              </label>
              <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Insurance Types</option>
                <option>Blue Cross Blue Shield</option>
                <option>Aetna</option>
                <option>United Healthcare</option>
                <option>Self-Pay</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
              Search Therapists
            </button>
          </div>
        </div>
        
        {/* Results */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Available Therapists
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-white">👩‍⚕️</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Dr. Sarah Johnson</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Licensed Clinical Psychologist</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      Anxiety & Depression
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                      Cognitive Behavioral Therapy
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">⭐ 4.9 (127 reviews)</span>
                    <span className="text-sm text-gray-500">📍 Downtown Seattle</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                  Book Appointment
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm">
                  View Profile
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-white">👨‍⚕️</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Dr. Michael Chen</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Licensed Marriage & Family Therapist</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs">
                      Trauma & PTSD
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">
                      EMDR Therapy
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">⭐ 4.8 (89 reviews)</span>
                    <span className="text-sm text-gray-500">📍 Bellevue</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                  Book Appointment
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm">
                  View Profile
                </button>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 text-center mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Don't see what you're looking for?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our care coordinators can help you find the perfect therapist match
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
              Get Personalized Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TherapistFinder };