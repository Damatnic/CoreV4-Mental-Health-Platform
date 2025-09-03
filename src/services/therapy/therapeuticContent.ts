// Therapeutic Content Service with CBT, DBT, ACT, and Mindfulness techniques

export interface TherapeuticPrompt {
  id: string;
  type: 'cbt' | 'dbt' | 'act' | 'mindfulness' | 'positive-psychology' | 'somatic';
  category: string;
  title: string;
  description: string;
  prompt: string;
  followUpQuestions: string[];
  relatedEmotions: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  benefits: string[];
  examples?: string[];
  worksheetUrl?: string;
}

export interface TherapeuticExercise {
  id: string;
  type: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  equipment?: string[];
  benefits: string[];
  contraindications?: string[];
  videoUrl?: string;
}

// CBT (Cognitive Behavioral Therapy) Prompts
export const CBT_PROMPTS: TherapeuticPrompt[] = [
  {
    id: 'cbt-thought-record',
    type: 'cbt',
    category: 'Thought Challenging',
    title: 'Thought Record',
    description: 'Identify and challenge negative thought patterns',
    prompt: 'Describe a situation that triggered strong emotions today. What thoughts went through your mind?',
    followUpQuestions: [
      'What evidence supports this thought?',
      'What evidence contradicts this thought?',
      'Is there an alternative way to view this situation?',
      'What would you tell a friend in this situation?',
      'How can you reframe this thought more realistically?'
    ],
    relatedEmotions: ['anxiety', 'depression', 'anger', 'frustration'],
    skillLevel: 'beginner',
    estimatedTime: 15,
    benefits: [
      'Identifies cognitive distortions',
      'Develops balanced thinking',
      'Reduces emotional intensity'
    ],
    examples: [
      'Situation: Friend didn\'t reply to text. Thought: "They must hate me." Alternative: "They might be busy."'
    ]
  },
  {
    id: 'cbt-behavioral-activation',
    type: 'cbt',
    category: 'Behavioral Activation',
    title: 'Activity Scheduling',
    description: 'Plan meaningful activities to improve mood',
    prompt: 'What activities used to bring you joy or satisfaction? Choose one to schedule this week.',
    followUpQuestions: [
      'When will you do this activity?',
      'What might get in the way?',
      'How can you overcome these obstacles?',
      'Who could support you in this?',
      'How will you reward yourself after completing it?'
    ],
    relatedEmotions: ['depression', 'apathy', 'loneliness'],
    skillLevel: 'beginner',
    estimatedTime: 10,
    benefits: [
      'Increases positive reinforcement',
      'Breaks depression cycles',
      'Builds momentum for change'
    ]
  },
  {
    id: 'cbt-cognitive-distortions',
    type: 'cbt',
    category: 'Cognitive Restructuring',
    title: 'Identifying Thinking Errors',
    description: 'Recognize common cognitive distortions',
    prompt: 'Review your thoughts today. Which thinking errors did you notice? (All-or-nothing, Mind reading, Catastrophizing, etc.)',
    followUpQuestions: [
      'Which distortion appears most frequently?',
      'What triggers this type of thinking?',
      'How does this distortion affect your emotions?',
      'What would be a more balanced perspective?',
      'How can you catch this distortion earlier next time?'
    ],
    relatedEmotions: ['anxiety', 'worry', 'self-criticism'],
    skillLevel: 'intermediate',
    estimatedTime: 20,
    benefits: [
      'Increases self-awareness',
      'Improves thought flexibility',
      'Reduces automatic negative thoughts'
    ]
  },
  {
    id: 'cbt-problem-solving',
    type: 'cbt',
    category: 'Problem Solving',
    title: 'Structured Problem Solving',
    description: 'Systematic approach to solving problems',
    prompt: 'What problem are you facing right now? Let\'s break it down step by step.',
    followUpQuestions: [
      'Define the problem specifically',
      'Brainstorm all possible solutions (even silly ones)',
      'List pros and cons for each solution',
      'Choose the best solution',
      'What\'s your action plan?',
      'How will you evaluate if it worked?'
    ],
    relatedEmotions: ['stress', 'overwhelm', 'helplessness'],
    skillLevel: 'beginner',
    estimatedTime: 25,
    benefits: [
      'Reduces feeling stuck',
      'Builds confidence',
      'Develops practical skills'
    ]
  }
];

// DBT (Dialectical Behavior Therapy) Prompts
export const DBT_PROMPTS: TherapeuticPrompt[] = [
  {
    id: 'dbt-wise-mind',
    type: 'dbt',
    category: 'Mindfulness',
    title: 'Wise Mind',
    description: 'Balance _emotion mind and reasonable mind',
    prompt: 'Take a moment to connect with your wise mind. What does your intuition tell you about this situation?',
    followUpQuestions: [
      'What is your _emotion mind saying?',
      'What is your reasonable mind saying?',
      'Where do these two perspectives overlap?',
      'What feels true and right in your gut?',
      'What action aligns with your wise mind?'
    ],
    relatedEmotions: ['confusion', 'conflict', 'uncertainty'],
    skillLevel: 'intermediate',
    estimatedTime: 15,
    benefits: [
      'Integrates logic and _emotion',
      'Improves decision-making',
      'Builds inner wisdom'
    ]
  },
  {
    id: 'dbt-distress-tolerance',
    type: 'dbt',
    category: 'Distress Tolerance',
    title: 'TIPP Skills',
    description: 'Quick techniques to manage crisis',
    prompt: 'You\'re in distress. Let\'s use TIPP: Temperature, Intense exercise, Paced breathing, Paired muscle relaxation.',
    followUpQuestions: [
      'Can you splash cold water on your face?',
      'Can you do jumping jacks for 60 seconds?',
      'Try breathing in for 4, hold for 4, out for 6',
      'Tense and release each muscle group',
      'How do you feel now compared to before?'
    ],
    relatedEmotions: ['panic', 'rage', 'crisis'],
    skillLevel: 'beginner',
    estimatedTime: 5,
    benefits: [
      'Rapidly reduces emotional intensity',
      'Prevents impulsive actions',
      'Regulates nervous system'
    ]
  },
  {
    id: 'dbt-radical-acceptance',
    type: 'dbt',
    category: 'Distress Tolerance',
    title: 'Radical Acceptance',
    description: 'Accept reality without fighting it',
    prompt: 'What situation are you struggling to accept? Let\'s practice radical acceptance.',
    followUpQuestions: [
      'What are the facts of the situation?',
      'What cannot be changed?',
      'What suffering comes from non-acceptance?',
      'Can you accept this moment as it is?',
      'What can you still control or influence?'
    ],
    relatedEmotions: ['anger', 'grief', 'disappointment'],
    skillLevel: 'advanced',
    estimatedTime: 20,
    benefits: [
      'Reduces suffering',
      'Increases peace',
      'Frees energy for change'
    ]
  },
  {
    id: 'dbt-_emotion-regulation',
    type: 'dbt',
    category: 'Emotion Regulation',
    title: 'PLEASE Skills',
    description: 'Reduce vulnerability to emotions',
    prompt: 'Let\'s check your PLEASE factors: Physical illness, balance Eating, avoid mood-Altering substances, balance Sleep, get Exercise.',
    followUpQuestions: [
      'Are you taking care of any physical health issues?',
      'Have you eaten balanced meals today?',
      'Are you avoiding substances that affect your mood?',
      'Did you get enough sleep last night?',
      'Have you moved your body today?'
    ],
    relatedEmotions: ['irritability', 'mood swings', 'sensitivity'],
    skillLevel: 'beginner',
    estimatedTime: 10,
    benefits: [
      'Stabilizes mood',
      'Prevents emotional vulnerability',
      'Builds resilience'
    ]
  },
  {
    id: 'dbt-interpersonal',
    type: 'dbt',
    category: 'Interpersonal Effectiveness',
    title: 'DEARMAN',
    description: 'Effective communication strategy',
    prompt: 'Need to make a request or set a boundary? Use DEARMAN: Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate.',
    followUpQuestions: [
      'Describe the situation objectively',
      'Express your feelings using "I" statements',
      'Assert what you need clearly',
      'Reinforce the benefits for both parties',
      'How will you stay mindful during the conversation?',
      'How can you appear confident?',
      'What are you willing to negotiate?'
    ],
    relatedEmotions: ['fear', 'anxiety', 'frustration'],
    skillLevel: 'intermediate',
    estimatedTime: 20,
    benefits: [
      'Improves relationships',
      'Gets needs met',
      'Maintains self-respect'
    ]
  }
];

// ACT (Acceptance and Commitment Therapy) Prompts
export const ACT_PROMPTS: TherapeuticPrompt[] = [
  {
    id: 'act-values-clarification',
    type: 'act',
    category: 'Values',
    title: 'Values Exploration',
    description: 'Identify what truly matters to you',
    prompt: 'If you could live your life according to what matters most to you, what would that look like?',
    followUpQuestions: [
      'What do you want to stand for in life?',
      'What relationships are most important?',
      'What kind of person do you want to be?',
      'What brings meaning to your life?',
      'How can you honor these values today?'
    ],
    relatedEmotions: ['emptiness', 'confusion', 'searching'],
    skillLevel: 'beginner',
    estimatedTime: 25,
    benefits: [
      'Clarifies life direction',
      'Increases motivation',
      'Guides decision-making'
    ]
  },
  {
    id: 'act-defusion',
    type: 'act',
    category: 'Cognitive Defusion',
    title: 'Thoughts as Thoughts',
    description: 'Observe thoughts without being controlled by them',
    prompt: 'Notice your thoughts as mental events, not facts. Try saying "I\'m having the thought that..."',
    followUpQuestions: [
      'What thought keeps recurring?',
      'Say: "I\'m having the thought that [thought]"',
      'Now say: "I notice I\'m having the thought that..."',
      'How does this change your relationship to the thought?',
      'Can you let this thought be there without fighting it?'
    ],
    relatedEmotions: ['rumination', 'obsession', 'worry'],
    skillLevel: 'intermediate',
    estimatedTime: 15,
    benefits: [
      'Reduces thought fusion',
      'Decreases rumination',
      'Increases psychological flexibility'
    ]
  },
  {
    id: 'act-committed-action',
    type: 'act',
    category: 'Committed Action',
    title: 'Values-Based Action',
    description: 'Take steps aligned with your values',
    prompt: 'What small action can you take today that aligns with your deepest values?',
    followUpQuestions: [
      'Which value will this action honor?',
      'What might get in the way?',
      'How can you work with obstacles?',
      'What\'s the smallest possible step?',
      'When will you take this action?'
    ],
    relatedEmotions: ['stuck', 'avoidance', 'procrastination'],
    skillLevel: 'beginner',
    estimatedTime: 15,
    benefits: [
      'Builds momentum',
      'Increases life satisfaction',
      'Creates meaningful change'
    ]
  }
];

// Mindfulness Prompts
export const MINDFULNESS_PROMPTS: TherapeuticPrompt[] = [
  {
    id: 'mindfulness-body-scan',
    type: 'mindfulness',
    category: 'Body Awareness',
    title: 'Body Scan',
    description: 'Systematic attention to body sensations',
    prompt: 'Let\'s do a quick body scan. Start at your toes and slowly move your attention up through your body.',
    followUpQuestions: [
      'What sensations do you notice in your feet?',
      'Any tension in your shoulders?',
      'How does your breath feel?',
      'Where do you hold stress in your body?',
      'What does your body need right now?'
    ],
    relatedEmotions: ['tension', 'stress', 'disconnection'],
    skillLevel: 'beginner',
    estimatedTime: 10,
    benefits: [
      'Increases body awareness',
      'Releases tension',
      'Grounds in present moment'
    ]
  },
  {
    id: 'mindfulness-54321',
    type: 'mindfulness',
    category: 'Grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'Sensory grounding technique',
    prompt: 'Let\'s ground yourself in the present moment using your senses.',
    followUpQuestions: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste'
    ],
    relatedEmotions: ['anxiety', 'panic', 'dissociation'],
    skillLevel: 'beginner',
    estimatedTime: 5,
    benefits: [
      'Reduces anxiety quickly',
      'Prevents dissociation',
      'Anchors to present'
    ]
  },
  {
    id: 'mindfulness-loving-kindness',
    type: 'mindfulness',
    category: 'Compassion',
    title: 'Loving-Kindness Meditation',
    description: 'Cultivate compassion for self and others',
    prompt: 'Let\'s practice sending loving-kindness to yourself and others.',
    followUpQuestions: [
      'Place hand on heart and say: "May I be happy"',
      '"May I be healthy"',
      '"May I be safe"',
      '"May I live with ease"',
      'Now extend these wishes to someone you love',
      'Then to someone neutral',
      'Finally to someone difficult'
    ],
    relatedEmotions: ['anger', 'resentment', 'self-criticism'],
    skillLevel: 'intermediate',
    estimatedTime: 15,
    benefits: [
      'Increases self-compassion',
      'Reduces anger',
      'Improves relationships'
    ]
  }
];

// Positive Psychology Prompts
export const POSITIVE_PSYCHOLOGY_PROMPTS: TherapeuticPrompt[] = [
  {
    id: 'positive-gratitude',
    type: 'positive-psychology',
    category: 'Gratitude',
    title: 'Three Good Things',
    description: 'Focus on positive experiences',
    prompt: 'What are three good things that happened today, no matter how small?',
    followUpQuestions: [
      'Why did this good thing happen?',
      'What role did you play in it?',
      'How did it make you feel?',
      'Who else was involved?',
      'How can you create more of this?'
    ],
    relatedEmotions: ['sadness', 'pessimism', 'dissatisfaction'],
    skillLevel: 'beginner',
    estimatedTime: 10,
    benefits: [
      'Increases optimism',
      'Improves mood',
      'Builds resilience'
    ]
  },
  {
    id: 'positive-strengths',
    type: 'positive-psychology',
    category: 'Character Strengths',
    title: 'Strength Spotting',
    description: 'Identify and use your character strengths',
    prompt: 'What personal strength did you use today? How did it help you?',
    followUpQuestions: [
      'What are your top 5 character strengths?',
      'Which strength came naturally today?',
      'How did using this strength feel?',
      'How can you use this strength tomorrow?',
      'What new way could you apply this strength?'
    ],
    relatedEmotions: ['inadequacy', 'low self-esteem', 'doubt'],
    skillLevel: 'beginner',
    estimatedTime: 15,
    benefits: [
      'Builds confidence',
      'Increases self-awareness',
      'Enhances performance'
    ]
  }
];

// Therapeutic Exercises
export const THERAPEUTIC_EXERCISES: TherapeuticExercise[] = [
  {
    id: 'breathing-478',
    type: 'breathing',
    name: '4-7-8 Breathing',
    description: 'Calming breath technique for anxiety and sleep',
    instructions: [
      'Exhale completely through your mouth',
      'Close your mouth, inhale through nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale completely through mouth for 8 counts',
      'Repeat 3-4 times'
    ],
    duration: 5,
    difficulty: 'easy',
    benefits: [
      'Reduces anxiety',
      'Improves sleep',
      'Lowers blood pressure'
    ]
  },
  {
    id: 'pmr-progressive',
    type: 'relaxation',
    name: 'Progressive Muscle Relaxation',
    description: 'Systematic tensing and relaxing of muscle groups',
    instructions: [
      'Start with your toes, tense for 5 seconds',
      'Release suddenly and notice the relaxation',
      'Move up to calves, thighs, glutes',
      'Continue through abdomen, hands, arms',
      'Finish with shoulders, neck, and face',
      'End with whole body tension and release'
    ],
    duration: 15,
    difficulty: 'medium',
    benefits: [
      'Reduces muscle tension',
      'Improves sleep',
      'Decreases anxiety'
    ],
    contraindications: ['Recent injury', 'Muscle disorders']
  },
  {
    id: 'butterfly-hug',
    type: 'somatic',
    name: 'Butterfly Hug',
    description: 'Self-soothing bilateral stimulation technique',
    instructions: [
      'Cross your arms over your chest',
      'Place hands on opposite shoulders',
      'Tap alternately with each hand',
      'Continue for 30-60 seconds',
      'Notice any shifts in feelings'
    ],
    duration: 2,
    difficulty: 'easy',
    benefits: [
      'Calms nervous system',
      'Processes emotions',
      'Self-soothing'
    ]
  }
];

// Get personalized prompts based on current emotional state
export function getPersonalizedPrompts(
  emotions: string[],
  preferredTypes: string[] = [],
  skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): TherapeuticPrompt[] {
  const allPrompts = [
    ...CBT_PROMPTS,
    ...DBT_PROMPTS,
    ...ACT_PROMPTS,
    ...MINDFULNESS_PROMPTS,
    ...POSITIVE_PSYCHOLOGY_PROMPTS
  ];
  
  // Filter by skill level
  let filteredPrompts = allPrompts.filter(p => {
    if (skillLevel === 'beginner') return p.skillLevel === 'beginner';
    if (skillLevel === 'intermediate') return p.skillLevel !== 'advanced';
    return true; // Advanced users can access all
  });
  
  // Filter by preferred therapy types if specified
  if (preferredTypes.length > 0) {
    filteredPrompts = filteredPrompts.filter(p => 
      preferredTypes.includes(p.type)
    );
  }
  
  // Score prompts based on emotion relevance
  const scoredPrompts = filteredPrompts.map(prompt => {
    let score = 0;
    emotions.forEach(_emotion => {
      if (prompt.relatedEmotions.includes(_emotion)) {
        score += 2;
      }
    });
    
    // Bonus for shorter exercises when in crisis
    if (emotions.includes('crisis') || emotions.includes('panic')) {
      if (prompt.estimatedTime <= 5) score += 3;
    }
    
    return { prompt, score };
  });
  
  // Sort by relevance score and return top matches
  return scoredPrompts
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(sp => sp.prompt);
}

// Get crisis-specific interventions
export function getCrisisInterventions(): TherapeuticPrompt[] {
  return [
    DBT_PROMPTS.find(p => p.id === 'dbt-distress-tolerance')!,
    MINDFULNESS_PROMPTS.find(p => p.id === 'mindfulness-54321')!,
    ...THERAPEUTIC_EXERCISES.filter(e => e.duration <= 5).map(e => ({
      id: e.id,
      type: 'mindfulness' as const,
      category: 'Crisis',
      title: e.name,
      description: e.description,
      prompt: `Let's do a quick ${e.name} exercise`,
      followUpQuestions: e.instructions,
      relatedEmotions: ['crisis', 'panic', 'overwhelm'],
      skillLevel: 'beginner' as const,
      estimatedTime: e.duration,
      benefits: e.benefits
    }))
  ];
}

// Generate a therapeutic worksheet
export function generateWorksheet(promptId: string): string {
  const prompt = [...CBT_PROMPTS, ...DBT_PROMPTS, ...ACT_PROMPTS, ...MINDFULNESS_PROMPTS, ...POSITIVE_PSYCHOLOGY_PROMPTS]
    .find(p => p.id === promptId);
  
  if (!prompt) return '';
  
  let worksheet = `# ${prompt.title} Worksheet\n\n`;
  worksheet += `## ${prompt.description}\n\n`;
  worksheet += `### Main Prompt:\n${prompt.prompt}\n\n`;
  worksheet += `### Reflection Questions:\n`;
  
  prompt.followUpQuestions.forEach((q, i) => {
    worksheet += `\n${i + 1}. ${q}\n`;
    worksheet += `   _________________________________\n`;
    worksheet += `   _________________________________\n`;
    worksheet += `   _________________________________\n`;
  });
  
  worksheet += `\n### Benefits of this exercise:\n`;
  prompt.benefits.forEach(b => {
    worksheet += `- ${b}\n`;
  });
  
  worksheet += `\n### Notes:\n`;
  worksheet += `_________________________________\n`;
  worksheet += `_________________________________\n`;
  worksheet += `_________________________________\n`;
  
  worksheet += `\n### Date: ____________  Time: ____________\n`;
  
  return worksheet;
}