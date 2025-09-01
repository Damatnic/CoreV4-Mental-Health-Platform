import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Check, 
  Shield, Brain, Heart, Users, Target, 
  Sparkles, Bell, MapPin, Phone, Settings,
  HelpCircle, Award, TrendingUp
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../contexts/AnonymousAuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

interface DashboardOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function DashboardOnboarding({ onComplete, onSkip }: DashboardOnboardingProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showWelcome, setShowWelcome] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Personal Dashboard',
      description: 'Your mental health journey starts here',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Hi {user?.name?.split(' ')[0] || 'there'}! Your new dashboard is designed to support your mental wellness journey with powerful tools and insights.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm">24/7 Crisis Support</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Check className="h-5 w-5 text-blue-600" />
              <span className="text-sm">AI-Powered Insights</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
              <Check className="h-5 w-5 text-purple-600" />
              <span className="text-sm">Activity Tracking</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
              <Check className="h-5 w-5 text-orange-600" />
              <span className="text-sm">Professional Care</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'crisis',
      title: 'Crisis Support Always Available',
      description: 'Get help when you need it most',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Phone className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-semibold text-red-900">Emergency Hotline: 988</h4>
                <p className="text-sm text-red-700 mt-1">
                  Available 24/7 for immediate crisis support. This number is always accessible, even offline.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Your crisis panel includes:</p>
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Real-time risk assessment</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">One-tap emergency contacts</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Location sharing for emergencies</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Personalized safety plan</span>
              </li>
            </ul>
          </div>
        </div>
      ),
      actionLabel: 'Set Up Safety Plan',
      action: () => {
        window.location.href = '/crisis/safety-plan';
      }
    },
    {
      id: 'tracking',
      title: 'Track Your Progress',
      description: 'Monitor your wellness journey',
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Track your mood, activities, and wellness goals all in one place.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">7</div>
                <div className="text-xs text-gray-600">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-xs text-gray-600">Goal Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">+12</div>
                <div className="text-xs text-gray-600">Mood Trend</div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
            <Award className="h-5 w-5 text-yellow-600" />
            <span className="text-sm">Earn achievements as you progress!</span>
          </div>
        </div>
      ),
      actionLabel: 'Log First Mood',
      action: () => {
        window.location.href = '/wellness/mood';
      }
    },
    {
      id: 'ai-insights',
      title: 'AI-Powered Insights',
      description: 'Get personalized recommendations',
      icon: Brain,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Our AI analyzes your patterns to provide personalized insights and recommendations.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Pattern Recognition</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Identifies triggers and positive influences in your daily life
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Smart Recommendations</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Suggests activities and coping strategies based on your needs
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Progress Predictions</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Forecasts your wellness trajectory and celebrates achievements
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'customize',
      title: 'Make It Yours',
      description: 'Customize your dashboard',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Personalize your dashboard to match your needs and preferences.
          </p>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Widget Layout</h4>
              <p className="text-xs text-gray-600">
                Drag and drop widgets to arrange your perfect dashboard
              </p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Notification Preferences</h4>
              <p className="text-xs text-gray-600">
                Choose when and how you want to receive reminders
              </p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Privacy Settings</h4>
              <p className="text-xs text-gray-600">
                Control your data sharing and visibility preferences
              </p>
            </div>
          </div>
        </div>
      ),
      actionLabel: 'Open Settings',
      action: () => {
        window.location.href = '/settings';
      }
    }
  ];

  useEffect(() => {
    trackEvent('onboarding_started', {
      userId: user?.id,
      totalSteps: steps.length
    });
  }, []);

  const handleNext = () => {
    const step = steps[currentStep];
    if (!step) return;
    
    setCompletedSteps(prev => new Set(prev).add(step.id));
    
    trackEvent('onboarding_step_completed', {
      stepId: step.id,
      stepIndex: currentStep
    });

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('dashboard_onboarding_completed', 'true');
    trackEvent('onboarding_completed', {
      userId: user?.id,
      completedSteps: Array.from(completedSteps)
    });
    onComplete();
  };

  const handleSkip = () => {
    trackEvent('onboarding_skipped', {
      userId: user?.id,
      skippedAtStep: currentStep
    });
    if (onSkip) {
      onSkip();
    } else {
      handleComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Early return if no current step data
  if (!currentStepData) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-500 to-purple-600 p-6 text-white">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <currentStepData.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentStepData.title}</h2>
                <p className="text-sm text-white/80">{currentStepData.description}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className="bg-white rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[400px] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={currentStep === 0 ? handleSkip : handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{currentStep === 0 ? 'Skip' : 'Back'}</span>
              </button>
              
              <div className="flex space-x-3">
                {currentStepData.action && (
                  <button
                    onClick={currentStepData.action}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {currentStepData.actionLabel}
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                >
                  <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}