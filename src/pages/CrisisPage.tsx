export function CrisisPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-display font-bold text-red-900 mb-4">
          Crisis Support Resources
        </h1>
        <p className="text-red-700 mb-6">
          If you're in immediate danger, please call 911 or your local emergency number.
        </p>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">988 Suicide & Crisis Lifeline</h3>
            <p className="text-gray-700 mb-2">Call or text 988 for 24/7 support</p>
            <button className="btn-crisis">Call 988</button>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Crisis Text Line</h3>
            <p className="text-gray-700 mb-2">Text HOME to 741741</p>
            <button className="btn-crisis">Text Now</button>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Emergency Services</h3>
            <p className="text-gray-700 mb-2">For immediate emergency assistance</p>
            <button className="btn-crisis">Call 911</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Create Your Safety Plan</h2>
          <p className="card-description">
            A safety plan can help you navigate through difficult moments
          </p>
        </div>
        <div className="card-content">
          <button className="btn-primary">Start Safety Plan</button>
        </div>
      </div>
    </div>
  );
}