import { useState } from 'react';
import { motion } from 'framer-motion';
import { WellnessToolsSuite } from '../components/wellness/WellnessToolsSuite';

export function WellnessPage() {
  const [_showFullSuite, setShowFullSuite] = useState(true); // Default to full suite

  // If full suite is active, render it
  if (_showFullSuite) {
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

  // Otherwise show the console-themed overview cards
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Dynamic Background Effects - Console Style */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white">
            Wellness Tools
          </h1>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onClick={() => setShowFullSuite(true)}
            className="px-6 py-3 bg-gradient-to-r from-console-accent/80 to-blue-500 text-white rounded-console font-semibold backdrop-blur-md border border-console-accent/20 hover:shadow-console-glow transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-console-accent/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Open Full Wellness Suite
          </motion.button>
        </motion.div>
        
        {/* Console Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            { emoji: "🧘", title: "Meditation", description: "Guided meditation sessions with timer", delay: 0.1 },
            { emoji: "🌬️", title: "Breathing Exercises", description: "Evidence-based breathing techniques", delay: 0.2 },
            { emoji: "📝", title: "Therapeutic Journal", description: "CBT/DBT-based journaling", delay: 0.3 },
            { emoji: "💪", title: "Wellness Dashboard", description: "Track all wellness metrics", delay: 0.4 },
            { emoji: "😴", title: "Sleep & Habits", description: "Track sleep and daily habits", delay: 0.5 },
            { emoji: "🎯", title: "Mood Tracker", description: "Monitor emotional patterns", delay: 0.6 }
          ].map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + tool.delay, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-depth rounded-2xl overflow-hidden hover:shadow-console-hover transition-all duration-300 hover:scale-[1.02] group"
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-r from-console-accent/30 to-transparent blur-xl" />
              </div>
              
              <div className="relative z-10 p-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    className="text-4xl mb-3"
                  >
                    {tool.emoji}
                  </motion.div>
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-console-accent transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowFullSuite(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-console-accent/20 to-blue-500/20 text-console-accent border border-console-accent/30 rounded-console font-medium transition-all duration-300 hover:from-console-accent/30 hover:to-blue-500/30 hover:shadow-console-glow hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-console-accent/50 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Console Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">
            Your Wellness Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Today's Score", value: "85/100", emoji: "🏆", color: "from-yellow-500/20 to-orange-500/20", border: "yellow-500/30" },
              { label: "Streak", value: "7 days", emoji: "🔥", color: "from-red-500/20 to-pink-500/20", border: "red-500/30" },
              { label: "Meditation", value: "120 min", emoji: "🧘", color: "from-purple-500/20 to-violet-500/20", border: "purple-500/30" },
              { label: "Journal Entries", value: "24", emoji: "📝", color: "from-blue-500/20 to-cyan-500/20", border: "blue-500/30" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + index * 0.1, duration: 0.6 }}
                className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md rounded-2xl p-6 shadow-console-depth hover:shadow-console-hover transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className={`absolute top-2 right-2 w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} blur-lg`} />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white group-hover:text-console-accent transition-colors">
                      {stat.value}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                    className="text-3xl opacity-80"
                  >
                    {stat.emoji}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Console Footer Inspiration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md rounded-2xl p-8 shadow-console-depth">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-4xl mb-4"
            >
              ✨
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Your Mental Health Journey
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Every step counts. These tools are here to support you on your path to better mental wellness. 
              Take it one day at a time, and remember—you&apos;re stronger than you think.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
// Default export for lazy loading
export default WellnessPage;
