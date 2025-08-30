export function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        Community Support
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Support Groups</h2>
              <p className="card-description">Join groups that understand your journey</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {supportGroups.map((group) => (
                  <div key={group.name} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>👥 {group.members} members</span>
                          <span>📝 {group.posts} posts today</span>
                        </div>
                      </div>
                      <button className="btn-outline">Join</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Community Guidelines</h2>
            </div>
            <div className="card-content">
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Be respectful and supportive</li>
                <li>✓ Maintain confidentiality</li>
                <li>✓ No medical advice</li>
                <li>✓ Report concerning content</li>
                <li>✓ Practice active listening</li>
              </ul>
            </div>
          </div>

          <div className="card mt-6">
            <div className="card-header">
              <h2 className="card-title">Upcoming Events</h2>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-semibold">Mindfulness Workshop</div>
                  <div className="text-gray-600">Tomorrow, 3:00 PM</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold">Group Meditation</div>
                  <div className="text-gray-600">Friday, 6:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const supportGroups = [
  {
    name: 'Anxiety Support Circle',
    description: 'A safe space for those dealing with anxiety disorders',
    members: 1234,
    posts: 23,
  },
  {
    name: 'Depression Warriors',
    description: 'Supporting each other through depression',
    members: 2341,
    posts: 45,
  },
  {
    name: 'Mindful Living',
    description: 'Practicing mindfulness and meditation together',
    members: 3456,
    posts: 67,
  },
  {
    name: 'Trauma Recovery',
    description: 'Healing from trauma with peer support',
    members: 890,
    posts: 12,
  },
];