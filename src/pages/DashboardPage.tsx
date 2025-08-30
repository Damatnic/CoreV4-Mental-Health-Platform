export function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        Your Dashboard
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Mood Tracker Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's Mood</h2>
              <p className="card-description">How are you feeling today?</p>
            </div>
            <div className="card-content">
              <p className="text-gray-600">Mood tracking component will be here</p>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Activities</h2>
            </div>
            <div className="card-content">
              <p className="text-gray-600">Activity feed will be here</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-content space-y-2">
              <button className="w-full btn-outline">Start Meditation</button>
              <button className="w-full btn-outline">Journal Entry</button>
              <button className="w-full btn-outline">Schedule Session</button>
            </div>
          </div>

          {/* Wellness Score */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Wellness Score</h2>
            </div>
            <div className="card-content">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600">85</div>
                <p className="text-gray-600">Great progress!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}