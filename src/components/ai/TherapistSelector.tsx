import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Heart, Shield, 
  CheckCircle, Star, Clock, User
} from 'lucide-react';

export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  description: string;
  avatar: string;
  personality: string;
  experience: string;
  approach: string;
  color: string;
  expertise: string[];
  rating: number;
  consultations: number;
}

const therapists: Therapist[] = [
  {
    id: 'dr-emma-chen',
    name: 'Dr. Emma Chen',
    specialty: 'Anxiety & Depression',
    description: 'Warm, empathetic specialist in cognitive behavioral therapy and mindfulness. Known for her gentle approach to anxiety management.',
    avatar: '👩⚕️',
    personality: 'Gentle, understanding, with a deeply calming presence',
    experience: '12+ years in clinical psychology',
    approach: 'CBT, Mindfulness-Based Therapy, EMDR',
    color: 'from-purple-500 to-blue-600',
    expertise: ['Anxiety Disorders', 'Depression', 'Panic Attacks', 'Social Anxiety', 'Mindfulness'],
    rating: 4.9,
    consultations: 2847
  },
  {
    id: 'dr-marcus-johnson',
    name: 'Dr. Marcus Johnson',
    specialty: 'Trauma & PTSD Recovery',
    description: 'Experienced trauma specialist with expertise in EMDR and somatic therapy. Compassionate approach to healing complex trauma.',
    avatar: '👨⚕️',
    personality: 'Strong, supportive, and deeply empathetic with trauma survivors',
    experience: '15+ years in trauma-informed therapy',
    approach: 'EMDR, Somatic Therapy, Trauma-Informed CBT',
    color: 'from-red-500 to-orange-600',
    expertise: ['PTSD', 'Complex Trauma', 'Sexual Trauma', 'Combat PTSD', 'Dissociation'],
    rating: 4.8,
    consultations: 1923
  },
  {
    id: 'dr-sofia-rodriguez',
    name: 'Dr. Sofia Rodriguez',
    specialty: 'Relationships & Family Dynamics',
    description: 'Expert in couples therapy and family systems. Specializes in communication, attachment, and relationship repair.',
    avatar: '👩🦰',
    personality: 'Insightful, patient, excellent at reading interpersonal dynamics',
    experience: '10+ years in couples & family therapy',
    approach: 'Gottman Method, EFT, Family Systems Therapy',
    color: 'from-pink-500 to-rose-600',
    expertise: ['Couples Therapy', 'Family Conflict', 'Communication Skills', 'Attachment Issues', 'Divorce Support'],
    rating: 4.9,
    consultations: 1654
  },
  {
    id: 'dr-alex-thompson',
    name: 'Dr. Alex Thompson',
    specialty: 'Life Transitions & Personal Growth',
    description: 'Specializes in major life changes, career transitions, and personal development. Combines therapy with life coaching.',
    avatar: '🧑⚕️',
    personality: 'Motivating, practical, forward-thinking growth mindset',
    experience: '8+ years in positive psychology & coaching',
    approach: 'Positive Psychology, ACT, Solution-Focused Therapy',
    color: 'from-green-500 to-teal-600',
    expertise: ['Career Transitions', 'Life Changes', 'Goal Setting', 'Self-Esteem', 'Purpose Finding'],
    rating: 4.7,
    consultations: 1205
  },
  {
    id: 'dr-maya-patel',
    name: 'Dr. Maya Patel',
    specialty: 'Stress & Burnout Recovery',
    description: 'Expert in workplace stress, burnout prevention, and work-life balance. Helps high-achievers find sustainable success.',
    avatar: '👩💼',
    personality: 'Practical, energetic, results-oriented with compassion',
    experience: '11+ years in occupational psychology',
    approach: 'Stress Management, Resilience Training, Mindfulness',
    color: 'from-yellow-500 to-orange-500',
    expertise: ['Workplace Stress', 'Burnout Recovery', 'Work-Life Balance', 'Executive Coaching', 'Resilience'],
    rating: 4.8,
    consultations: 1876
  },
  {
    id: 'dr-james-wilson',
    name: 'Dr. James Wilson',
    specialty: 'Addiction & Recovery Support',
    description: 'Compassionate addiction specialist focused on sustainable recovery, relapse prevention, and family healing.',
    avatar: '👨🔬',
    personality: 'Non-judgmental, hopeful, steadfast in recovery support',
    experience: '18+ years in addiction medicine',
    approach: '12-Step Integration, Motivational Interviewing, Harm Reduction',
    color: 'from-indigo-500 to-purple-600',
    expertise: ['Substance Abuse', 'Behavioral Addictions', 'Relapse Prevention', 'Family Recovery', 'Dual Diagnosis'],
    rating: 4.9,
    consultations: 2156
  },
  {
    id: 'dr-sarah-kim',
    name: 'Dr. Sarah Kim',
    specialty: 'Youth & Adolescent Mental Health',
    description: 'Specializes in teen and young adult mental health. Expert in identity development, social anxiety, and family dynamics.',
    avatar: '👩🎓',
    personality: 'Relatable, understanding, speaks the language of young people',
    experience: '9+ years in adolescent psychology',
    approach: 'DBT for Teens, Family Therapy, Identity Development',
    color: 'from-cyan-500 to-blue-500',
    expertise: ['Teen Depression', 'Social Anxiety', 'Identity Issues', 'Family Conflict', 'Academic Stress'],
    rating: 4.8,
    consultations: 1432
  },
  {
    id: 'dr-david-brown',
    name: 'Dr. David Brown',
    specialty: 'Men\'s Mental Health & Masculinity',
    description: 'Focuses on men\'s unique mental health challenges, emotional expression, and redefining healthy masculinity.',
    avatar: '👨🦲',
    personality: 'Direct, authentic, creates safe space for vulnerability',
    experience: '13+ years specializing in men\'s issues',
    approach: 'Masculine Psychology, Emotion-Focused Therapy, CBT',
    color: 'from-slate-500 to-gray-600',
    expertise: ['Men\'s Depression', 'Anger Management', 'Emotional Expression', 'Father Issues', 'Masculinity'],
    rating: 4.7,
    consultations: 987
  }
];

interface TherapistSelectorProps {
  onSelectTherapist: (therapist: Therapist) => void;
  selectedTherapist?: Therapist;
  _showDetailedView?: boolean;
}

export const TherapistSelector: React.FC<TherapistSelectorProps> = ({ 
  onSelectTherapist, 
  selectedTherapist,
  _showDetailedView = true
}) => {
  const [__hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');

  const specialties = [...new Set(therapists.map(t => t.specialty))];
  const filteredTherapists = filterSpecialty === 'all' 
    ? therapists 
    : therapists.filter(t => t.specialty === filterSpecialty);

  return (
    <div className="therapist-selector bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-console-accent to-blue-400 p-3 rounded-2xl mr-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Choose Your AI Therapist</h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Select a specialized AI therapist that resonates with your needs. Each has unique expertise, personality, and therapeutic approach.
            </p>
          </div>
        </div>

        {/* Specialty Filter */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={() => setFilterSpecialty('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              filterSpecialty === 'all' 
                ? 'bg-console-accent text-white shadow-console-glow' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Specialties
          </button>
          {specialties.map(specialty => (
            <button
              key={specialty}
              onClick={() => setFilterSpecialty(specialty)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filterSpecialty === specialty 
                  ? 'bg-console-accent text-white shadow-console-glow' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Therapist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTherapists.map((therapist, index) => (
          <motion.div
            key={therapist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
              selectedTherapist?.id === therapist.id 
                ? 'ring-2 ring-console-accent shadow-console-glow' 
                : 'hover:scale-105'
            }`}
            onMouseEnter={() => setHoveredCard(therapist.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectTherapist(therapist)}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${therapist.color} opacity-90`} />
            
            {/* Content */}
            <div className="relative p-6 text-white h-full flex flex-col">
              {/* Selected Badge */}
              {selectedTherapist?.id === therapist.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 bg-white text-green-600 p-1 rounded-full"
                >
                  <CheckCircle className="h-5 w-5" />
                </motion.div>
              )}

              {/* Avatar and Rating */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{therapist.avatar}</div>
                <div className="flex items-center space-x-1 bg-black/20 rounded-full px-2 py-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{therapist.rating}</span>
                </div>
              </div>

              {/* Name and Specialty */}
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">{therapist.name}</h3>
                <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium inline-block">
                  {therapist.specialty}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 mb-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{therapist.experience.split('+')[0]}+ years</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{therapist.consultations.toLocaleString()}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm opacity-90 mb-4 flex-1">
                {therapist.description}
              </p>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {therapist.expertise.slice(0, 3).map(skill => (
                  <span
                    key={skill}
                    className="bg-white/20 rounded-full px-2 py-1 text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {therapist.expertise.length > 3 && (
                  <span className="bg-white/20 rounded-full px-2 py-1 text-xs">
                    +{therapist.expertise.length - 3} more
                  </span>
                )}
              </div>

              {/* Approach */}
              <div className="text-xs opacity-80">
                <strong>Approach:</strong> {therapist.approach}
              </div>

              {/* Hover Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredCard === therapist.id ? 1 : 0 }}
                className="absolute inset-0 bg-black/20 flex items-center justify-center"
              >
                <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Choose {therapist.name.split(' ')[1]}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <div className="bg-gray-800/50 rounded-2xl p-6 max-w-4xl mx-auto border border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-console-accent mr-2" />
            <h3 className="text-lg font-semibold text-white">AI Therapeutic Support</h3>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            These AI therapists are advanced conversational companions designed to provide personalized mental health support. 
            They combine evidence-based therapeutic approaches with AI technology to offer accessible, immediate help. 
            <strong className="text-white"> They complement but do not replace professional mental health treatment.</strong> 
            If you're experiencing a mental health emergency, please contact emergency services or call 988.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TherapistSelector;