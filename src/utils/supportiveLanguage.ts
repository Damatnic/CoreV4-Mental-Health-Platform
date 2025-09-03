/**
 * Supportive Language Transformer
 * 
 * Converts technical/harsh language into warm, supportive messages
 * Designed to create a safe, non-judgmental environment
 */

export const supportiveMessages = {
  // Error Messages - Technical to Supportive
  errors: {
    generic: "Something didn't work quite right, and that's okay. Let's try again together.",
    network: "It looks like we're having trouble connecting. This happens sometimes - let's give it another moment.",
    notFound: "We couldn't find what you're looking for, but we're here to help you find your way.",
    unauthorized: "This area needs special access. No worries - there's plenty of other support available.",
    serverError: "Our system needs a moment to catch up. Thank you for your patience.",
    validation: "Let's adjust a few things to continue. We're here to guide you.",
    timeout: "This is taking a bit longer than expected. Let's take a breath and try once more.",
  },

  // Loading States
  loading: {
    default: "Getting things ready for you...",
    resources: "Gathering helpful resources...",
    profile: "Setting up your safe space...",
    data: "Preparing your information...",
    slow: "Taking a moment longer - thank you for waiting with us...",
  },

  // Success Messages
  success: {
    saved: "Your changes are safely saved.",
    submitted: "Thank you for sharing. Your information has been received.",
    created: "Successfully created! You're doing great.",
    updated: "Everything's been updated. Well done!",
    deleted: "Removed successfully. Your space is just how you want it.",
  },

  // Form Validation - Gentle Guidance
  validation: {
    required: "This information helps us support you better.",
    email: "Let's double-check that email address together.",
    phone: "Phone numbers help us stay connected - let's verify the format.",
    password: "Let's create a password that keeps you safe (at least 8 characters).",
    passwordMatch: "The passwords don't quite match - let's try once more.",
    minLength: (min: number) => `Just a bit more detail would help (at least ${min} characters).`,
    maxLength: (max: number) => `Let's keep this concise (up to ${max} characters).`,
  },

  // Empty States
  empty: {
    default: "This space is ready for you to fill when you're ready.",
    search: "No results right now, but that's okay. Try different words or browse our resources.",
    messages: "No messages yet. When you're ready to connect, we'll be here.",
    activities: "No activities yet. Start small - even one step is progress.",
    goals: "No goals set yet. Remember, there's no rush. Start when you feel ready.",
  },

  // Encouragement Messages
  encouragement: {
    welcome: "Welcome to your safe space. You're not alone here.",
    morning: "Good morning! Today is a new opportunity for growth and healing.",
    afternoon: "Good afternoon! You're doing better than you think.",
    evening: "Good evening! Rest is just as important as progress.",
    night: "It's late - remember that rest is a form of self-care.",
    progress: "Every small step counts. You're making progress.",
    crisis: "You're being so brave by reaching out. Help is here.",
  },

  // Button Labels - Action to Invitation
  buttons: {
    submit: "Share with us",
    save: "Save your progress",
    cancel: "Take a different path",
    retry: "Let's try again",
    continue: "Continue your journey",
    back: "Go back",
    next: "Move forward",
    finish: "Complete this step",
    help: "Get support",
    close: "Close for now",
  },

  // Navigation - Warm Directions
  navigation: {
    home: "Return to your safe space",
    dashboard: "View your wellness dashboard",
    resources: "Explore helpful resources",
    support: "Find support options",
    community: "Connect with others",
    settings: "Adjust your preferences",
    profile: "Your personal space",
    logout: "Take a break",
    login: "Welcome back",
  },

  // Confirmation Messages
  confirmations: {
    delete: "Are you sure you want to remove this? This action helps you maintain your space.",
    leave: "You have unsaved changes. It's okay to leave - you can always come back.",
    logout: "Ready to take a break? Your progress is saved.",
    cancel: "Any unsaved changes will be lost. That's okay if you need to step away.",
  },

  // Time-Based Greetings
  getTimeBasedGreeting: (name?: string): string => {
    const hour = new Date().getHours();
    const userName = name ? `, ${name}` : '';
    
    if (hour < 6) {
      return `It's very early${userName}. If you can't sleep, we're here for you.`;
    } else if (hour < 12) {
      return `Good morning${userName}! Today holds new possibilities.`;
    } else if (hour < 17) {
      return `Good afternoon${userName}! You're doing great today.`;
    } else if (hour < 21) {
      return `Good evening${userName}! Hope your day has been kind to you.`;
    } else {
      return `It's getting late${userName}. Remember to be gentle with yourself.`;
    }
  },

  // Crisis Support Language
  crisis: {
    detected: "We've noticed you might be going through a difficult time. You're not alone.",
    support: "Immediate support is available. You deserve help and compassion.",
    breathing: "Let's take a moment to breathe together. You're safe here.",
    grounding: "Let's try a grounding exercise. Focus on what you can see, hear, and feel.",
    contact: "Would you like to connect with someone who can help?",
    resources: "Here are some resources that might help right now.",
  },

  // Wellness Check-ins
  wellness: {
    checkIn: "How are you feeling today? There's no wrong answer.",
    mood: "Your feelings are valid, whatever they may be.",
    grateful: "What's one small thing you're grateful for today?",
    accomplished: "What's something you accomplished today, no matter how small?",
    selfCare: "Have you taken time for yourself today? You deserve it.",
  },
};

/**
 * Transform harsh technical errors into supportive messages
 */
export function transformErrorMessage(error: string | Error): string {
  const errorString = typeof error === 'string' ? error : error.message;
  
  // Map common technical errors to supportive messages
  const _errorMappings: Record<string, string> = {
    'Network Error': supportiveMessages.errors.network,
    '404': supportiveMessages.errors.notFound,
    '401': supportiveMessages.errors.unauthorized,
    '403': supportiveMessages.errors.unauthorized,
    '500': supportiveMessages.errors.serverError,
    'timeout': supportiveMessages.errors.timeout,
    'Validation failed': supportiveMessages.errors.validation,
  };

  // Check if we have a mapping for this error
  for (const [key, value] of Object.entries(_errorMappings)) {
    if (errorString.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default to generic supportive message
  return supportiveMessages.errors.generic;
}

/**
 * Get contextual encouragement based on user state
 */
export function getEncouragement(context?: {
  isStruggling?: boolean;
  hasProgress?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  inCrisis?: boolean;
}): string {
  if (context?.inCrisis) {
    return supportiveMessages.encouragement.crisis;
  }

  if (context?.hasProgress) {
    return supportiveMessages.encouragement.progress;
  }

  if (context?.timeOfDay) {
    return supportiveMessages.encouragement[context.timeOfDay];
  }

  // Get time-based encouragement
  const hour = new Date().getHours();
  if (hour < 12) return supportiveMessages.encouragement.morning;
  if (hour < 17) return supportiveMessages.encouragement.afternoon;
  if (hour < 21) return supportiveMessages.encouragement.evening;
  return supportiveMessages.encouragement.night;
}

/**
 * Create a warm, supportive notification
 */
export function createSupportiveNotification(
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  supportive = true
): { title: string; message: string; icon?: string } {
  if (!supportive) {
    return { title: type, message };
  }

  const titles = {
    success: 'Well done!',
    error: "It's okay",
    info: 'Just so you know',
    warning: 'Gentle reminder',
  };

  const icons = {
    success: '💚',
    error: '🤗',
    info: '💙',
    warning: '💛',
  };

  return {
    title: titles[type],
    message: type === 'error' ? transformErrorMessage(message) : message,
    icon: icons[type],
  };
}