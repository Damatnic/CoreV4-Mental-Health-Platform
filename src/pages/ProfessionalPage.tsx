export function ProfessionalPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        Professional Support
      </h1>
      
      <div className="mb-8">
        <div className="bg-primary-50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-primary-900 mb-2">
            Connect with Licensed Professionals
          </h2>
          <p className="text-primary-700">
            Find therapists, counselors, and mental health professionals who can help
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((professional) => (
          <div key={professional.name} className="card hover:shadow-lg transition-shadow">
            <div className="card-header">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{professional.name}</h3>
                  <p className="text-sm text-gray-600">{professional.title}</p>
                </div>
                <div className="text-sm text-primary-600 font-semibold">
                  {professional.available ? 'Available' : 'Busy'}
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">{professional.specialties.join(', ')}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="text-gray-600">{professional.rating} ({professional.reviews})</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ${professional.rate}/session
                </p>
              </div>
              <button className="btn-primary w-full">Book Session</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 card">
        <div className="card-header">
          <h2 className="card-title">How It Works</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-semibold mb-1">Browse Professionals</h3>
              <p className="text-sm text-gray-600">Find the right match for your needs</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-semibold mb-1">Book a Session</h3>
              <p className="text-sm text-gray-600">Choose a convenient time slot</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-semibold mb-1">Start Your Journey</h3>
              <p className="text-sm text-gray-600">Connect via video, phone, or chat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const professionals = [
  {
    name: 'Dr. Sarah Johnson',
    title: 'Clinical Psychologist',
    specialties: ['Anxiety', 'Depression', 'Trauma'],
    rating: 4.9,
    reviews: 127,
    rate: 150,
    available: true,
  },
  {
    name: 'Michael Chen, LMFT',
    title: 'Marriage & Family Therapist',
    specialties: ['Relationships', 'Family Dynamics'],
    rating: 4.8,
    reviews: 93,
    rate: 120,
    available: true,
  },
  {
    name: 'Dr. Emily Rodriguez',
    title: 'Psychiatrist',
    specialties: ['Medication Management', 'Bipolar', 'ADHD'],
    rating: 4.9,
    reviews: 156,
    rate: 200,
    available: false,
  },
  {
    name: 'James Williams, LCSW',
    title: 'Clinical Social Worker',
    specialties: ['Grief', 'Life Transitions', 'Stress'],
    rating: 4.7,
    reviews: 84,
    rate: 100,
    available: true,
  },
  {
    name: 'Dr. Lisa Park',
    title: 'Counseling Psychologist',
    specialties: ['Self-Esteem', 'Career Counseling'],
    rating: 4.8,
    reviews: 102,
    rate: 130,
    available: true,
  },
  {
    name: 'Robert Taylor, LPC',
    title: 'Licensed Professional Counselor',
    specialties: ['Addiction', 'Recovery', 'Mindfulness'],
    rating: 4.9,
    reviews: 178,
    rate: 110,
    available: true,
  },
];