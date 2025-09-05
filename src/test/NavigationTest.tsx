import React from 'react';
import { Link } from 'react-router-dom';

export function NavigationTest() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Navigation Test Component</h1>
      
      <div className="space-y-4 max-w-lg">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Test Navigation Links:</h2>
          <div className="space-y-2">
            <Link 
              to="/" 
              className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => console.log('Navigating to Dashboard')}
            >
              Dashboard (/)
            </Link>
            
            <Link 
              to="/wellness" 
              className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => console.log('Navigating to Wellness')}
            >
              Wellness (/wellness)
            </Link>
            
            <Link 
              to="/community" 
              className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              onClick={() => console.log('Navigating to Community')}
            >
              Community (/community)
            </Link>
            
            <Link 
              to="/crisis" 
              className="block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => console.log('Navigating to Crisis')}
            >
              Crisis (/crisis)
            </Link>
            
            <Link 
              to="/professional" 
              className="block px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              onClick={() => console.log('Navigating to Professional')}
            >
              Professional (/professional)
            </Link>
            
            <Link 
              to="/settings" 
              className="block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => console.log('Navigating to Settings')}
            >
              Settings (/settings)
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Test Buttons:</h2>
          <div className="space-y-2">
            <button 
              onClick={() => {
                console.log('Button clicked!');
                alert('Button click works!');
              }}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Test Button Click
            </button>
            
            <button 
              onClick={() => {
                console.log('Navigating programmatically to /wellness');
                window.location.href = '/wellness';
              }}
              className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Navigate with window.location
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Current Location:</h2>
          <p className="text-gray-700">Path: {window.location.pathname}</p>
          <p className="text-gray-700">Hash: {window.location.hash || '(none)'}</p>
          <p className="text-gray-700">Search: {window.location.search || '(none)'}</p>
        </div>
      </div>
    </div>
  );
}

export default NavigationTest;