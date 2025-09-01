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
    <div className="therapist-finder p-4">
      <h2 className="text-2xl font-bold mb-4">Find a Therapist</h2>
      <p className="text-gray-600">Connect with qualified mental health professionals in your area.</p>
      
      <div className="mt-6 space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Search Filters</h3>
          <div className="mt-2 space-y-2">
            <input 
              type="text" 
              placeholder="Location" 
              className="w-full p-2 border rounded"
              defaultValue={location}
            />
            <input 
              type="text" 
              placeholder="Specialty" 
              className="w-full p-2 border rounded"
              defaultValue={specialty}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Dr. Sarah Johnson</h4>
            <p className="text-sm text-gray-600">Clinical Psychologist - Anxiety & Depression</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Dr. Michael Chen</h4>
            <p className="text-sm text-gray-600">Licensed Therapist - Trauma Specialist</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TherapistFinder };