export function WellnessPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        Wellness Tools
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">🧘</div>
            <h2 className="card-title">Meditation</h2>
            <p className="card-description">Guided meditation sessions</p>
          </div>
          <div className="card-content">
            <button className="btn-primary w-full">Start Session</button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">🌬️</div>
            <h2 className="card-title">Breathing Exercises</h2>
            <p className="card-description">Calm your mind with breathing</p>
          </div>
          <div className="card-content">
            <button className="btn-primary w-full">Begin Exercise</button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">📝</div>
            <h2 className="card-title">Journaling</h2>
            <p className="card-description">Express your thoughts</p>
          </div>
          <div className="card-content">
            <button className="btn-primary w-full">Write Entry</button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">💪</div>
            <h2 className="card-title">Exercise Tracking</h2>
            <p className="card-description">Physical wellness matters</p>
          </div>
          <div className="card-content">
            <button className="btn-primary w-full">Log Activity</button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">😴</div>
            <h2 className="card-title">Sleep Tracker</h2>
            <p className="card-description">Monitor your sleep patterns</p>
          </div>
          <div className="card-content">
            <button className="btn-primary w-full">Track Sleep</button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className="text-3xl mb-2">🎯</div>
            <h2 className="card-title">Goal Setting</h2>
            <p className="card-description">Set and achieve wellness goals</p>
          </div>
          <div className="card-content">
            <button className="btn-primary w-full">Set Goals</button>
          </div>
        </div>
      </div>
    </div>
  );
}