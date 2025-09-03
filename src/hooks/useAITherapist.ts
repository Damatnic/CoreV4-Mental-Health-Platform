import { useState, useCallback, useEffect, useRef } from 'react';
import { Therapist } from '../components/ai/TherapistSelector';
import { detectCrisisLevel, CrisisLevel } from '../utils/crisis';
import { logger } from '../utils/logger';

export interface TherapistMessage {
  id: string;
  sender: 'user' | 'therapist';
  text: string;
  timestamp: Date;
  therapistId?: string;
  sessionId?: string;
  mood?: 'supportive' | 'challenging' | 'analytical' | 'empathetic';
  techniques?: string[];
}

export interface TherapySession {
  id: string;
  therapistId: string;
  messages: TherapistMessage[];
  startTime: Date;
  lastActivity: Date;
  sessionNotes?: string;
  mood: 'starting' | 'engaged' | 'processing' | 'concluding';
  techniques: string[];
  insights: string[];
}

interface UseAITherapistOptions {
  therapist: Therapist;
  sessionId?: string;
  autoSave?: boolean;
}

export const useAITherapist = ({ therapist, sessionId, autoSave = true }: UseAITherapistOptions) => {
  const [session, setSession] = useState<TherapySession | null>(null);
  const [__isTyping, setIsTyping] = useState(false);
  const [__isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize or load session
  useEffect(() => {
    initializeSession();
  }, [therapist.id, sessionId, initializeSession]);

  // Auto-save session
  useEffect(() => {
    if (session && autoSave) {
      saveSession();
    }
  }, [session, autoSave, saveSession]);

  const initializeSession = useCallback(async () => {
    try {
      let existingSession: TherapySession | null = null;

      // Try to load existing session
      if (sessionId) {
        const _savedSession = localStorage.getItem(`therapy-session-${sessionId}`);
        if (_savedSession) {
          existingSession = JSON.parse(_savedSession);
        }
      }

      // Create new session if none exists
      if (!existingSession) {
        const newSession: TherapySession = {
          id: sessionId || `session-${Date.now()}`,
          therapistId: therapist.id,
          messages: [],
          startTime: new Date(),
          lastActivity: new Date(),
          mood: 'starting',
          techniques: [],
          insights: []
        };

        // Add welcome message based on therapist personality
        const _welcomeMessage = generateWelcomeMessage(_therapist);
        newSession.messages.push(_welcomeMessage);
        
        existingSession = newSession;
      }

      setSession(_existingSession);
      setIsConnected(true);
    } catch (error) {
      logger.error('Failed to initialize therapy session:');
      setIsConnected(false);
    }
  }, [therapist.id, therapist.name, sessionId]);

  const generateWelcomeMessage = (therapist: Therapist): TherapistMessage => {
    const welcomeMessages = {
      'dr-emma-chen': "Hello, I'm Dr. Emma Chen. I'm here to create a safe, calming space where we can explore your thoughts and feelings together. What's on your mind today?",
      'dr-marcus-johnson': "I'm Dr. Marcus Johnson. I understand that sharing your experiences can be difficult, and I want you to know this is a completely safe space. Take your time - I'm here to listen.",
      'dr-sofia-rodriguez': "Hi, I'm Dr. Sofia Rodriguez. Relationships and connections are at the heart of our wellbeing. I'm curious to learn about your world and the people in it. What brings you here today?",
      'dr-alex-thompson': "Hello! I'm Dr. Alex Thompson. I believe in your potential for growth and positive change. Let's explore what you'd like to work on and how I can best support your journey forward.",
      'dr-maya-patel': "I'm Dr. Maya Patel. I know how overwhelming stress and burnout can feel, but you've taken an important step by being here. Let's talk about what's been weighing on you lately.",
      'dr-james-wilson': "Hi, I'm Dr. James Wilson. Recovery is a journey that takes courage, and you've already shown that by being here. This is a judgment-free space where we can talk honestly about whatever you're facing.",
      'dr-sarah-kim': "Hey there! I'm Dr. Sarah Kim. I know it can feel weird talking to someone about personal stuff, but I get it - I work with people your age all the time. What's been going on in your world?",
      'dr-david-brown': "I'm Dr. David Brown. I know it's not always easy for guys to open up about what's really going on inside. This is a space where you can be completely honest about your thoughts and feelings without judgment."
    };

    return {
      id: `welcome-${Date.now()}`,
      sender: 'therapist',
      text: welcomeMessages[therapist.id as keyof typeof welcomeMessages] || 
            `Hello, I'm ${therapist.name}. I'm here to support you through whatever you're experiencing. What would you like to talk about today?`,
      timestamp: new Date(),
      therapistId: therapist.id,
      mood: 'supportive'
    };
  };

  const _sendMessage  = useCallback(async (text: string) => {
    if (!session || !text.trim()) return;

    const _userMessage: TherapistMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
      therapistId: therapist.id,
      sessionId: session.id
    };

    // Add user message immediately
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, _userMessage],
      lastActivity: new Date()
    } : null);

    setIsTyping(true);

    try {
      // Simulate realistic typing delay
      const typingDelay = Math.random() * 2000 + 1000;
      
      // Generate therapist response
      const therapistResponse = await generateTherapistResponse(
        [...session.messages, _userMessage], 
        therapist
      );

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Add response after delay
      typingTimeoutRef.current = setTimeout(() => {
        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, therapistResponse],
          lastActivity: new Date(),
          mood: determineSessionMood(prev.messages.length),
          techniques: updateTechniques(prev.techniques, therapistResponse.techniques || [])
        } : null);
        
        setIsTyping(false);
      }, typingDelay);

    } catch (error) {
      logger.error('Failed to generate therapist response:');
      
      // Add undefined recovery message
      const errorMessage: TherapistMessage = {
        id: `msg-${Date.now()}-error`,
        sender: 'therapist',
        text: "I'm having a moment of technical difficulty. Let me take a breath and refocus on you. Could you repeat what you just shared?",
        timestamp: new Date(),
        therapistId: therapist.id,
        mood: 'supportive'
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage],
        lastActivity: new Date()
      } : null);
      
      setIsTyping(false);
    }
  }, [session, therapist, generateTherapistResponse]);

  const generateTherapistResponse = useCallback(async (
    messages: TherapistMessage[], 
    therapist: Therapist
  ): Promise<TherapistMessage> => {
    // Analyze the conversation context
    const userMessages = messages.filter(m => m.sender === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.text || '';
    const conversationLength = userMessages.length;
    
    // Determine response mood and techniques
    const mood = determineResponseMood(lastUserMessage, therapist, conversationLength);
    const techniques = selectTechniques(therapist, lastUserMessage, conversationLength);
    
    // Generate response based on therapist's specialty and approach
    let response = '';
    
    switch (therapist.specialty) {
      case 'Anxiety & Depression':
        response = generateAnxietyDepressionResponse(lastUserMessage, conversationLength, mood);
        break;
      case 'Trauma & PTSD Recovery':
        response = generateTraumaResponse(lastUserMessage, conversationLength, mood);
        break;
      case 'Relationships & Family Dynamics':
        response = generateRelationshipResponse(lastUserMessage, conversationLength, mood);
        break;
      case 'Life Transitions & Personal Growth':
        response = generateGrowthResponse(lastUserMessage, conversationLength, mood);
        break;
      case 'Stress & Burnout Recovery':
        response = generateStressResponse(lastUserMessage, conversationLength, mood);
        break;
      case 'Addiction & Recovery Support':
        response = generateRecoveryResponse(lastUserMessage, conversationLength, mood);
        break;
      case 'Youth & Adolescent Mental Health':
        response = generateYouthResponse(lastUserMessage, conversationLength, mood);
        break;
      case "Men's Mental Health & Masculinity":
        response = generateMensHealthResponse(lastUserMessage, conversationLength, mood);
        break;
      default:
        response = generateGeneralResponse(lastUserMessage, conversationLength, mood);
    }

    return {
      id: `msg-${Date.now()}-therapist`,
      sender: 'therapist',
      text: response,
      timestamp: new Date(),
      therapistId: therapist.id,
      mood,
      techniques
    };
  }, []);

  // Helper function to check for crisis indicators
  const checkForCrisisIndicators = (message: string): CrisisLevel => {
    const assessment = detectCrisisLevel(message);
    return assessment.level;
  };

  // Generate appropriate crisis response
  const generateCrisisResponse = (level: CrisisLevel): string => {
    if (level === 'critical') {
      return "I'm deeply concerned about what you're sharing. Your safety is my top priority right now. I want you to know that you're not alone, and there is help available immediately. Would you be willing to call the 988 Suicide & Crisis Lifeline with me right now? They have trained counselors available 24/7. You can also text HOME to 741741 for crisis support. Your life matters, and there are people who want to help you through this.";
    }
    if (level === 'high') {
      return "I can hear that you're going through something really intense right now. Thank you for trusting me with these feelings. It sounds like you might benefit from some immediate support. The 988 Lifeline (call or text 988) has counselors available 24/7 who specialize in helping people through moments like this. Would you like to talk about what's making you feel this way? I'm here to listen and support you.";
    }
    return "I'm noticing that you're dealing with some difficult feelings. That takes courage to share. Let's work through this together, and remember that support is always available if things feel too overwhelming.";
  };

  // Response generators for different specialties with evidence-based techniques
  const generateAnxietyDepressionResponse = (_userMessage: string, length: number, mood: string): string => {
    // Check for crisis keywords first
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }

    const responses = {
      supportive: [
        "I hear the weight in your words, and I want you to know that what you're feeling is valid. Anxiety and depression can make everything feel overwhelming. Let's take this one moment at a time together.",
        "Thank you for sharing that with me. It takes courage to talk about these feelings. Your willingness to open up is actually a sign of strength, even if it doesn't feel that way right now.",
        "What you're describing sounds really difficult. I'm here with you in this moment. Would it help to practice a quick grounding exercise together? Sometimes connecting with the present can provide a bit of relief.",
        "I can sense how much pain you're carrying. These feelings won't last forever, even though they feel endless right now. Let's work on finding one small thing that might bring you a moment of ease."
      ],
      challenging: [
        "I notice you're being quite hard on yourself. Let's try an experiment - what would you say to your best friend if they were going through exactly what you're experiencing?",
        "You mentioned feeling like you 'always' do this. I'm curious - can you think of even one small exception, a time when things went differently?",
        "I'm hearing words like 'never', 'always', 'nothing works'. These are what we call cognitive distortions. What evidence do we have for and against these thoughts?",
        "It sounds like your inner critic is really loud right now. What if we tried to turn down its volume and listen to a more compassionate inner voice?"
      ],
      analytical: [
        "I'm noticing a pattern here. It seems like when you feel anxious about one thing, it triggers a cascade of other worries. Have you noticed this domino effect too?",
        "Let's map this out together. What specific thoughts come first? Then what happens in your body? And finally, what actions do you take? Understanding this sequence can help us interrupt it.",
        "I'm curious about the physical sensations you're experiencing. Our bodies often give us early warning signals. Where do you first notice the anxiety in your body?",
        "There seems to be a connection between what you're thinking and how you're feeling. Let's explore that thought-feeling-behavior cycle together."
      ],
      empathetic: [
        "My heart goes out to you. Living with anxiety and depression can feel like carrying an invisible weight that no one else can see.",
        "I want you to know that you're not alone in this struggle. What you're experiencing is real, and your feelings matter.",
        "I can hear how exhausted you are from fighting these feelings every day. It's okay to feel tired. Healing isn't linear, and some days are just about surviving.",
        "The fact that you're here, talking about this, shows incredible resilience. Even on your hardest days, you're still showing up, and that counts for something."
      ]
    };

    const moodResponses = responses[mood as keyof typeof responses] || responses.supportive;
    const selectedResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];
    return selectedResponse || "I'm here to support you through this difficult time.";
  };

  const generateTraumaResponse = (_userMessage: string, length: number, mood: string): string => {
    const responses = {
      supportive: [
        "I want to acknowledge your courage in sharing this. Trauma can make it feel unsafe to be vulnerable, yet here you are, trusting me with your experience.",
        "Your body and mind have been working so hard to protect you. What you're describing sounds like your system trying to keep you safe.",
        "There's no right or wrong way to heal from trauma. Your pace is the right pace, and I'll be here with you through this process."
      ],
      empathetic: [
        "That sounds incredibly difficult to carry. I can only imagine how that experience has affected you.",
        "Your feelings about this make complete sense given what you've been through. Trauma changes how we see the world, and that's normal.",
        "I hear how alone you've felt with this. You're not alone now - we're in this together."
      ],
      grounding: [
        "I notice you might be feeling overwhelmed right now. Can you feel your feet on the floor? Let's take a moment to ground ourselves.",
        "Your nervous system might be activated right now. Would it help to take some slow, deep breaths together?",
        "I want to remind you that you're safe in this moment, right here with me. The past cannot hurt you now."
      ]
    };

    const moodResponses = responses[mood as keyof typeof responses] || responses.supportive;
    const selectedResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];
    return selectedResponse || "I'm here to support you through this difficult time.";
  };

  // Helper function for response generators missing in the switch statement
  const generateRelationshipResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "Relationships can be our greatest source of joy and our deepest source of pain. What you're describing sounds challenging. Can you help me understand what this relationship means to you?",
      "I'm hearing that there's a lot of complexity in this relationship. It's okay to have mixed feelings about people we care about. What feels most pressing to address?",
      "Connection with others is fundamental to our wellbeing. It sounds like this relationship is affecting you deeply. Let's explore what healthy boundaries might look like for you."
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  const generateGrowthResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "Life transitions can feel overwhelming and exciting at the same time. What you're experiencing is a natural part of growth. What aspect of this change feels most significant to you?",
      "Change often brings up mixed emotions. It's completely normal to feel uncertain while also hopeful. Let's explore what this transition means for your sense of self.",
      "I hear that you're at a crossroads. These moments of decision can be powerful opportunities for self-discovery. What values are most important to you as you navigate this?"
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  const generateStressResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "Burnout is your body and mind's way of telling you that something needs to change. You're not weak for feeling overwhelmed - you're human. What would taking care of yourself look like right now?",
      "I can hear the exhaustion in your words. Chronic stress takes a real toll on our wellbeing. Let's think about small, manageable ways to create moments of relief in your day.",
      "The weight of constant stress can feel crushing. Your feelings are valid, and it's important to acknowledge how hard you've been working. What's one thing you could let go of, just for today?"
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  const generateRecoveryResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "Recovery is a journey with ups and downs, and every step forward counts, no matter how small. Your commitment to healing is evident in being here. What's helping you stay motivated today?",
      "Addiction recovery takes tremendous courage. The fact that you're talking about this shows strength. Remember, slips don't erase progress. What support do you need right now?",
      "I honor your bravery in facing this challenge. Recovery isn't just about stopping a behavior - it's about building a life worth living. What brings you meaning and purpose?"
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  const generateYouthResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "Being young doesn't make your feelings any less real or important. What you're going through matters, and I'm here to listen without judgment. What's been weighing on you?",
      "I get it - sometimes it feels like nobody understands what you're dealing with. Your experiences are unique to you, and they're valid. Want to tell me more about what's going on?",
      "Growing up in today's world comes with unique challenges that older generations might not fully understand. You're navigating a lot. What feels most overwhelming right now?"
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  const generateMensHealthResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "I appreciate you opening up - I know society often tells men they shouldn't talk about feelings. That's nonsense. Your emotions are valid and important. What's been on your mind?",
      "Strength isn't about hiding pain or going it alone. Real strength is reaching out when you need support, like you're doing now. What's been the hardest part for you?",
      "Men face unique pressures and expectations that can make mental health struggles feel isolating. You're not alone in this, and seeking help is a sign of wisdom, not weakness."
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  // General response generator
  const generateGeneralResponse = (_userMessage: string, _length: number, _mood: string): string => {
    const crisisLevel = checkForCrisisIndicators(_userMessage);
    if (crisisLevel === 'high' || crisisLevel === 'critical') {
      return generateCrisisResponse(_crisisLevel);
    }
    const responses = [
      "I'm here to listen and support you. Can you tell me more about what you're experiencing?",
      "Thank you for sharing that with me. What feels most important to explore right now?",
      "I hear you, and I want to understand your experience better. Help me see this from your perspective.",
      "Your feelings are valid and important. Let's take some time to understand what's happening for you.",
      "I'm glad you're here and willing to talk about this. What would be most helpful for you right now?"
    ];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    return selectedResponse || "I'm here to support you through this important moment.";
  };

  const determineResponseMood = (_userMessage: string, therapist: Therapist, messageCount: number): 'supportive' | 'challenging' | 'analytical' | 'empathetic' => {
    // Enhanced sentiment analysis with therapeutic consideration
    const lowerMessage = _userMessage.toLowerCase();
    
    // Priority 1: Check for emotional distress
    const distressWords = ['hurt', 'pain', 'trauma', 'abuse', 'scared', 'terrified', 'alone', 'suicide', 'death', 'die'];
    if (distressWords.some(_word => lowerMessage.includes(_word))) {
      return 'empathetic';
    }
    
    // Priority 2: Check for cognitive distortions (good for challenging)
    const distortionWords = ['always', 'never', "can't", 'should', 'must', 'everyone', 'no one', 'worst', 'terrible'];
    if (distortionWords.some(_word => lowerMessage.includes(_word))) {
      // Only challenge if relationship is established and therapist uses CBT
      if (messageCount > 3 && therapist.approach.includes('CBT')) {
        return 'challenging';
      }
      return 'supportive'; // Default to supportive early in conversation
    }
    
    // Priority 3: Check for analytical needs
    const analyticalWords = ['why', 'understand', 'pattern', 'reason', 'cause', 'explain', 'analyze', 'figure out'];
    if (analyticalWords.some(_word => lowerMessage.includes(_word))) {
      return 'analytical';
    }
    
    // Priority 4: Check emotional tone
    const sadWords = ['sad', 'depressed', 'hopeless', 'empty', 'numb', 'worthless'];
    const anxiousWords = ['anxious', 'worried', 'panic', 'nervous', 'stressed', 'overwhelmed'];
    
    if (sadWords.some(_word => lowerMessage.includes(_word)) || anxiousWords.some(word => lowerMessage.includes(_word))) {
      return 'empathetic';
    }
    
    // Default to supportive
    return 'supportive';
  };

  const determineSessionMood = (messageCount: number): TherapySession['mood'] => {
    if (messageCount < 4) return 'starting';
    if (messageCount < 10) return 'engaged';
    if (messageCount < 16) return 'processing';
    return 'concluding';
  };

  const selectTechniques = (therapist: Therapist, message: string, length: number): string[] => {
    const __availableTechniques = therapist.approach.split(', ');
    const selectedTechniques: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Evidence-based technique selection based on message content
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worry') || lowerMessage.includes('panic')) {
      selectedTechniques.push('Anxiety Management');
      if (lowerMessage.includes('breath') || lowerMessage.includes('heart')) {
        selectedTechniques.push('Breathing Exercises');
      }
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('hopeless')) {
      selectedTechniques.push('Behavioral Activation');
      selectedTechniques.push('Mood Monitoring');
    }
    
    if (length > 5 && (lowerMessage.includes('think') || lowerMessage.includes('thought'))) {
      selectedTechniques.push('Cognitive Restructuring');
      if (lowerMessage.includes('always') || lowerMessage.includes('never')) {
        selectedTechniques.push('Challenging Distortions');
      }
    }
    
    if (lowerMessage.includes('feel') || lowerMessage.includes('emotion') || lowerMessage.includes('overwhelming')) {
      selectedTechniques.push('Emotion Regulation');
      if (lowerMessage.includes('angry') || lowerMessage.includes('rage')) {
        selectedTechniques.push('Anger Management');
      }
    }
    
    if (lowerMessage.includes('trauma') || lowerMessage.includes('ptsd') || lowerMessage.includes('flashback')) {
      selectedTechniques.push('Grounding Techniques');
      selectedTechniques.push('Safety Planning');
    }
    
    if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('family')) {
      selectedTechniques.push('Communication Skills');
      selectedTechniques.push('Boundary Setting');
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('burnout')) {
      selectedTechniques.push('Stress Management');
      selectedTechniques.push('Self-Care Planning');
    }
    
    // Add mindfulness for longer conversations
    if (length > 10) {
      selectedTechniques.push('Mindfulness');
    }
    
    return [...new Set(_selectedTechniques)]; // Remove duplicates
  };

  const updateTechniques = (existing: string[], newTechniques: string[]): string[] => {
    const _combined = [...existing, ...newTechniques];
    return [...new Set(_combined)]; // Remove duplicates
  };

  const saveSession = useCallback(async () => {
    if (!session) return;
    
    try {
      localStorage.setItem(`therapy-session-${session.id}`, JSON.stringify(session));
    } catch (error) {
      logger.error('Failed to save therapy session:');
    }
  }, [session]);

  const _endSession  = useCallback(async () => {
    if (!session) return;

    // Generate session _summary
    const _summary = {
      ...session,
      endTime: new Date(),
      sessionNotes: `Session with ${therapist.name} - ${session.messages.length} messages exchanged. Techniques used: ${session.techniques.join(', ')}`
    };

    // Save final session state
    localStorage.setItem(`therapy-session-completed-${session.id}`, JSON.stringify(_summary));
    
    // Clear current session
    setSession(null);
    setIsConnected(false);
  }, [session, therapist]);

  const _clearSession  = useCallback(() => {
    if (session) {
      localStorage.removeItem(`therapy-session-${session.id}`);
    }
    setSession(null);
    setIsConnected(false);
  }, [session]);

  return {
    session,
    isTyping,
    isConnected,
    sendMessage,
    endSession,
    clearSession,
    therapist
  };
};

export default useAITherapist;