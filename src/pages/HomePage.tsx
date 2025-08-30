import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Your Mental Health
              <span className="text-primary-600"> Matters</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive platform for mental wellness, crisis support, and community connection.
              Take control of your mental health journey with professional guidance and peer support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/crisis" className="btn-outline text-lg px-8 py-3">
                Crisis Resources
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -z-10 opacity-10">
          <div className="w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 opacity-10">
          <div className="w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for your mental wellness journey in one secure platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Start Your Wellness Journey Today
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of users who have taken control of their mental health
            </p>
            <Link to="/dashboard" className="btn-primary text-lg px-10 py-4">
              Create Free Account
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Support',
    description: 'Get personalized mental health insights and recommendations powered by advanced AI.',
  },
  {
    icon: '📊',
    title: 'Mood Tracking',
    description: 'Track your emotional patterns and identify triggers with our intuitive mood tracker.',
  },
  {
    icon: '👥',
    title: 'Community Support',
    description: 'Connect with others on similar journeys in our moderated support groups.',
  },
  {
    icon: '👨‍⚕️',
    title: 'Professional Network',
    description: 'Access licensed therapists and mental health professionals when you need them.',
  },
  {
    icon: '🆘',
    title: 'Crisis Resources',
    description: '24/7 access to crisis support hotlines and emergency mental health resources.',
  },
  {
    icon: '🌱',
    title: 'Wellness Tools',
    description: 'Meditation, breathing exercises, and self-care activities for daily wellness.',
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '500+', label: 'Professionals' },
  { value: '98%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];