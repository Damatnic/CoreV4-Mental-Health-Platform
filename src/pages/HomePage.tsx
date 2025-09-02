import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Stethoscope, AlertTriangle, Clock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AnonymousAuthContext';

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  // Welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcoming Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {getWelcomeMessage()}{isAuthenticated ? `, ${user?.name || 'friend'}` : ''}! 👋
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Welcome to your safe space for mental wellness. Everything you need is just one click away.
          </p>
        </motion.div>

        {/* Quick Access Cards - Maximum 4 main actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Wellness Tools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <Link
              to="/wellness"
              className="block p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-700"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🧘 Wellness Tools</h3>
                  <p className="text-gray-600 dark:text-gray-300">Start your daily wellness routine</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Access meditation, breathing exercises, mood tracking, and therapeutic journaling - all in one place.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Meditation
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  Breathing
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm">
                  Journal
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Community Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <Link
              to="/community"
              className="block p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:border-green-200 dark:group-hover:border-green-700"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">💬 Community Support</h3>
                  <p className="text-gray-600 dark:text-gray-300">Connect with others who understand</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Join safe, moderated support groups and share your journey with people who care.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  24/7 Moderated
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Always Active
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Find Professionals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <Link
              to="/professional"
              className="block p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:border-yellow-200 dark:group-hover:border-yellow-700"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">👨‍⚕️ Find Professionals</h3>
                  <p className="text-gray-600 dark:text-gray-300">Connect with licensed therapists</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Search and book appointments with verified mental health professionals in your area.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                500+ Licensed Professionals Available
              </div>
            </Link>
          </motion.div>

          {/* Crisis Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group"
          >
            <Link
              to="/crisis"
              className="block p-8 bg-gradient-to-r from-pink-50 to-red-50 dark:from-red-900 dark:to-pink-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-red-200 dark:border-red-700 group-hover:border-red-300 dark:group-hover:border-red-600"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-red-600 rounded-xl animate-pulse">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🆘 Crisis Support</h3>
                  <p className="text-red-700 dark:text-red-300 font-semibold">Available 24/7</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Immediate help when you need it most. Crisis chat, emergency contacts, and safety planning.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-red-700 dark:text-red-300 font-semibold">
                  📞 National Crisis Line: 988
                </div>
                <div className="flex items-center text-red-700 dark:text-red-300 font-semibold">
                  💬 Crisis Text Line: Text HOME to 741741
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Today's Wellness Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Today's Wellness</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🌅</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Start Your Day</div>
              <div className="text-gray-600 dark:text-gray-300">Take 5 minutes for morning meditation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💝</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Self-Care Reminder</div>
              <div className="text-gray-600 dark:text-gray-300">You deserve kindness, especially from yourself</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌟</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">You're Not Alone</div>
              <div className="text-gray-600 dark:text-gray-300">Thousands of people are here to support you</div>
            </div>
          </div>
        </motion.div>

        {/* Simple Welcome Message for New Users */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold mb-4">New here? Welcome! 🎉</h2>
            <p className="text-blue-100 mb-6">
              This is your safe space. Everything is free, private, and designed to help you feel better.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Create Free Account
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Default export for lazy loading
export default HomePage;