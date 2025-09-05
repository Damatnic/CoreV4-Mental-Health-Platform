import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Heart, Users, Activity, MapPin, Save, Download, Share2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { secureStorage } from '../../services/security/SecureLocalStorage';
import { logger } from '../../utils/logger';

interface SupportPerson {
  name: string;
  phone: string;
  available: string;
}

interface ProfessionalContact {
  name: string;
  role: string;
  phone: string;
}

interface SafetyPlanData {
  warningSignals: string[];
  copingStrategies: string[];
  distractionTechniques: string[];
  supportPeople: SupportPerson[];
  safePlaces: string[];
  professionalContacts: ProfessionalContact[];
  reasonsToLive: string[];
  safeEnvironmentSteps: string[];
  lastUpdated: string;
}

type SafetyPlanSection = keyof SafetyPlanData;
type _SafetyPlanValue = SafetyPlanData[SafetyPlanSection];

const _DEFAULT_SAFETY_PLAN: SafetyPlanData = {
  warningSignals: [],
  copingStrategies: [],
  distractionTechniques: [],
  supportPeople: [],
  safePlaces: [],
  professionalContacts: [],
  reasonsToLive: [],
  safeEnvironmentSteps: [],
  lastUpdated: new Date().toISOString()
};

export function SafetyPlan() {
  const [safetyPlan, _setSafetyPlan] = useState<SafetyPlanData>(_DEFAULT_SAFETY_PLAN);
  const [activeSection, _setActiveSection] = useState<string>('warningSignals');
  const [isEditing, _setIsEditing] = useState(false);
  const [showTemplates, _setShowTemplates] = useState(false);
  const [autoSaveStatus, _setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Load safety plan from localStorage
  useEffect(() => {
    const _savedPlan = secureStorage.getItem('safetyPlan');
    if (_savedPlan) {
      _setSafetyPlan(JSON.parse(_savedPlan));
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const _saveTimer = setTimeout(() => {
      if (isEditing) {
        _setAutoSaveStatus('saving');
        secureStorage.setItem('safetyPlan', JSON.stringify(safetyPlan));
        setTimeout(() => _setAutoSaveStatus('saved'), 1000);
      }
    }, 2000);

    return () => clearTimeout(_saveTimer);
  }, [safetyPlan, isEditing]);

  const handleUpdateSection = <T extends SafetyPlanSection>(section: T, value: SafetyPlanData[T]) => {
    _setSafetyPlan({
      ...safetyPlan,
      [section]: value,
      lastUpdated: new Date().toISOString()
    });
  };

  const exportSafetyPlan = () => {
    const _dataStr = JSON.stringify(safetyPlan, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${ encodeURIComponent(_dataStr)}`;
    const exportFileDefaultName = `safety-plan-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareSafetyPlan = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Safety Plan',
          text: 'I created a safety plan for crisis situations',
          url: window.location.href
        });
      } catch (error) {
        logger.error('Error sharing safety plan', 'SafetyPlan', error);
      }
    } else {
      // Fallback: Copy to clipboard
      const planText = generatePlainTextPlan();
      navigator.clipboard.writeText(planText);
      toast.success('Safety plan copied to clipboard!');
    }
  };

  const generatePlainTextPlan = () => {
    let text = 'MY SAFETY PLAN\n';
    text += `${'=' .repeat(40)  }\n\n`;
    
    text += '1. WARNING SIGNALS:\n';
    safetyPlan.warningSignals.forEach(signal => text += `   • ${signal}\n`);
    
    text += '\n2. COPING STRATEGIES:\n';
    safetyPlan.copingStrategies.forEach(strategy => text += `   • ${strategy}\n`);
    
    text += '\n3. SUPPORT PEOPLE:\n';
    safetyPlan.supportPeople.forEach(person => 
      text += `   • ${person.name}: ${person.phone} (${person.available})\n`
    );
    
    text += '\n4. SAFE PLACES:\n';
    safetyPlan.safePlaces.forEach(place => text += `   • ${place}\n`);
    
    text += '\n5. PROFESSIONAL CONTACTS:\n';
    safetyPlan.professionalContacts.forEach(contact => 
      text += `   • ${contact.name} (${contact.role}): ${contact.phone}\n`
    );
    
    text += '\n6. REASONS TO LIVE:\n';
    safetyPlan.reasonsToLive.forEach(reason => text += `   • ${reason}\n`);
    
    text += `\nLast Updated: ${new Date(safetyPlan.lastUpdated).toLocaleDateString()}\n`;
    text += '\nCRISIS HOTLINES:\n';
    text += '   • 988 Suicide & Crisis Lifeline: Call or text 988\n';
    text += '   • Crisis Text Line: Text HOME to 741741\n';
    
    return text;
  };

  const loadTemplate = (templateType: string) => {
    const templates: Record<string, Partial<SafetyPlanData>> = {
      basic: {
        warningSignals: [
          'Feeling hopeless or trapped',
          'Increased anxiety or panic',
          'Difficulty sleeping',
          'Isolating from friends and family'
        ],
        copingStrategies: [
          'Practice deep breathing exercises',
          'Go for a walk in nature',
          'Listen to calming music',
          'Write in my journal'
        ],
        distractionTechniques: [
          'Watch a favorite movie or TV show',
          'Call a friend',
          'Do a puzzle or play a game',
          'Cook or bake something'
        ],
        reasonsToLive: [
          'My family and friends who care about me',
          'My goals and dreams for the future',
          'My pets who depend on me',
          'Beautiful experiences I want to have'
        ]
      },
      comprehensive: {
        warningSignals: [
          'Thoughts of self-harm or suicide',
          'Feeling overwhelmed or out of control',
          'Extreme mood swings',
          'Substance use urges',
          'Physical symptoms (headaches, chest pain)',
          'Sleep disturbances'
        ],
        copingStrategies: [
          '5-4-3-2-1 grounding technique',
          'Progressive muscle relaxation',
          'Mindfulness meditation',
          'Cold water on face or ice pack',
          'Intense exercise',
          'Creative expression (art, music, writing)'
        ],
        distractionTechniques: [
          'Clean or organize living space',
          'Watch comedy videos',
          'Play with pets',
          'Work on a hobby',
          'Help someone else',
          'Plan a future activity'
        ],
        safeEnvironmentSteps: [
          'Remove or secure potentially harmful items',
          'Give medications to a trusted person',
          'Avoid alcohol and drugs',
          'Stay with supportive people',
          'Create a calm, comfortable space'
        ],
        reasonsToLive: [
          'People I love and who love me',
          'Unfinished goals and projects',
          'Future experiences I want to have',
          'My values and beliefs',
          'The possibility of things getting better',
          'My unique contributions to the world'
        ]
      }
    };

    if (templates[templateType]) {
      _setSafetyPlan({
        ...safetyPlan,
        ...templates[templateType],
        lastUpdated: new Date().toISOString()
      });
      _setShowTemplates(false);
    }
  };

  const sections = [
    { id: 'warningSignals', title: 'Warning Signals', icon: AlertCircle, color: 'text-red-500' },
    { id: 'copingStrategies', title: 'Coping Strategies', icon: Heart, color: 'text-pink-500' },
    { id: 'distractionTechniques', title: 'Distraction Techniques', icon: Activity, color: 'text-purple-500' },
    { id: 'supportPeople', title: 'Support People', icon: Users, color: 'text-blue-500' },
    { id: 'safePlaces', title: 'Safe Places', icon: MapPin, color: 'text-green-500' },
    { id: 'professionalContacts', title: 'Professional Contacts', icon: Shield, color: 'text-indigo-500' },
    { id: 'reasonsToLive', title: 'Reasons to Live', icon: Heart, color: 'text-red-500' },
    { id: 'safeEnvironmentSteps', title: 'Safe Environment', icon: Shield, color: 'text-gray-500' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Shield className="h-8 w-8" />
              <span>My Safety Plan</span>
            </h2>
            <p className="mt-2 opacity-90">
              A personalized plan to help you through difficult moments
            </p>
            {safetyPlan.lastUpdated && (
              <p className="text-sm mt-1 opacity-75">
                Last updated: {new Date(safetyPlan.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {autoSaveStatus === 'saving' && (
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Saving...</span>
            )}
            {autoSaveStatus === 'saved' && (
              <CheckCircle className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => _setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isEditing
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Save Changes' : 'Edit Plan'}
        </button>
        <button
          onClick={() => _setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Use Template
        </button>
        <button
          onClick={exportSafetyPlan}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
        <button
          onClick={shareSafetyPlan}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Template Selection */}
      {showTemplates && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => loadTemplate('basic')}
              className="text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h4 className="font-semibold text-gray-900">Basic Template</h4>
              <p className="text-sm text-gray-600 mt-1">
                Essential safety plan elements for getting started
              </p>
            </button>
            <button
              onClick={() => loadTemplate('comprehensive')}
              className="text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h4 className="font-semibold text-gray-900">Comprehensive Template</h4>
              <p className="text-sm text-gray-600 mt-1">
                Detailed safety plan with extensive strategies
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => _setActiveSection(section.id)}
                className={`py-3 px-4 flex items-center space-x-2 font-medium text-sm transition-colors border-b-2 ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <section.icon className={`h-4 w-4 ${section.color}`} />
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Section Content */}
        <div className="p-6">
          {activeSection === 'warningSignals' && (
            <SectionEditor
              title="Warning Signals"
              description="Early signs that I&apos;m beginning to feel unwell"
              items={safetyPlan.warningSignals}
              onUpdate={(items: string[]) => handleUpdateSection('warningSignals', items)}
              isEditing={isEditing}
              placeholder="e.g., Feeling isolated, trouble sleeping..."
            />
          )}

          {activeSection === 'copingStrategies' && (
            <SectionEditor
              title="Coping Strategies"
              description="Things I can do on my own to feel better"
              items={safetyPlan.copingStrategies}
              onUpdate={(items: string[]) => handleUpdateSection('copingStrategies', items)}
              isEditing={isEditing}
              placeholder="e.g., Deep breathing, take a walk..."
            />
          )}

          {activeSection === 'distractionTechniques' && (
            <SectionEditor
              title="Distraction Techniques"
              description="Activities to take my mind off problems"
              items={safetyPlan.distractionTechniques}
              onUpdate={(items: string[]) => handleUpdateSection('distractionTechniques', items)}
              isEditing={isEditing}
              placeholder="e.g., Watch a movie, call a friend..."
            />
          )}

          {activeSection === 'supportPeople' && (
            <SupportPeopleEditor
              people={safetyPlan.supportPeople}
              onUpdate={(people: SupportPerson[]) => handleUpdateSection('supportPeople', people)}
              isEditing={isEditing}
            />
          )}

          {activeSection === 'safePlaces' && (
            <SectionEditor
              title="Safe Places"
              description="Places where I feel calm and secure"
              items={safetyPlan.safePlaces}
              onUpdate={(items: string[]) => handleUpdateSection('safePlaces', items)}
              isEditing={isEditing}
              placeholder="e.g., Library, park, friend&apos;s house..."
            />
          )}

          {activeSection === 'professionalContacts' && (
            <ProfessionalContactsEditor
              contacts={safetyPlan.professionalContacts}
              onUpdate={(contacts: ProfessionalContact[]) => handleUpdateSection('professionalContacts', contacts)}
              isEditing={isEditing}
            />
          )}

          {activeSection === 'reasonsToLive' && (
            <SectionEditor
              title="Reasons to Live"
              description="Things that are important to me and worth living for"
              items={safetyPlan.reasonsToLive}
              onUpdate={(items: string[]) => handleUpdateSection('reasonsToLive', items)}
              isEditing={isEditing}
              placeholder="e.g., Family, goals, beliefs..."
            />
          )}

          {activeSection === 'safeEnvironmentSteps' && (
            <SectionEditor
              title="Making Environment Safe"
              description="Steps to remove or reduce access to harmful means"
              items={safetyPlan.safeEnvironmentSteps}
              onUpdate={(items: string[]) => handleUpdateSection('safeEnvironmentSteps', items)}
              isEditing={isEditing}
              placeholder="e.g., Give medications to trusted person..."
            />
          )}
        </div>
      </div>

      {/* Crisis Resources Footer */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-3">24/7 Crisis Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = 'tel:988'}
            className="bg-white text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors border border-red-300"
          >
            Call 988
          </button>
          <button
            onClick={() => window.location.href = 'sms:741741?body=HOME'}
            className="bg-white text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors border border-red-300"
          >
            Text HOME to 741741
          </button>
          <button
            onClick={() => window.location.href = 'tel:911'}
            className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Call 911
          </button>
        </div>
      </div>
    </div>
  );
}

// Section Editor Component
interface SectionEditorProps {
  title: string;
  description: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  isEditing: boolean;
  placeholder: string;
}

function SectionEditor({ title, description, items, onUpdate, isEditing, placeholder }: SectionEditorProps) {
  const [newItem, _setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onUpdate([...items, newItem.trim()]);
      _setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      
      <div className="space-y-2 mb-4">
        {items.map((item: string, index: number) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-800">{item}</span>
            {isEditing && (
              <button
                onClick={() => handleRemove(index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => _setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// Support People Editor Component
interface SupportPeopleEditorProps {
  people: SupportPerson[];
  onUpdate: (people: SupportPerson[]) => void;
  isEditing: boolean;
}

function SupportPeopleEditor({ people, onUpdate, isEditing }: SupportPeopleEditorProps) {
  const [newPerson, _setNewPerson] = useState({ name: '', phone: '', available: '' });

  const handleAdd = () => {
    if (newPerson.name && newPerson.phone) {
      onUpdate([...people, newPerson]);
      _setNewPerson({ name: '', phone: '', available: '' });
    }
  };

  const handleRemove = (index: number) => {
    onUpdate(people.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Support People</h3>
      <p className="text-gray-600 mb-4">People I can reach out to when I need help</p>
      
      <div className="space-y-3 mb-4">
        {people.map((person, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{person.name}</p>
                <p className="text-sm text-blue-600">{person.phone}</p>
                {person.available && (
                  <p className="text-sm text-gray-500">Available: {person.available}</p>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="space-y-2">
          <input
            type="text"
            value={newPerson.name}
            onChange={(e) => _setNewPerson({ ...newPerson, name: e.target.value })}
            placeholder="Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            value={newPerson.phone}
            onChange={(e) => _setNewPerson({ ...newPerson, phone: e.target.value })}
            placeholder="Phone number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newPerson.available}
            onChange={(e) => _setNewPerson({ ...newPerson, available: e.target.value })}
            placeholder="When available (_optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Person
          </button>
        </div>
      )}
    </div>
  );
}

// Professional Contacts Editor Component
interface ProfessionalContactsEditorProps {
  contacts: ProfessionalContact[];
  onUpdate: (contacts: ProfessionalContact[]) => void;
  isEditing: boolean;
}

function ProfessionalContactsEditor({ contacts, onUpdate, isEditing }: ProfessionalContactsEditorProps) {
  const [newContact, _setNewContact] = useState({ name: '', role: '', phone: '' });

  const handleAdd = () => {
    if (newContact.name && newContact.phone) {
      onUpdate([...contacts, newContact]);
      _setNewContact({ name: '', role: '', phone: '' });
    }
  };

  const handleRemove = (index: number) => {
    onUpdate(contacts.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Contacts</h3>
      <p className="text-gray-600 mb-4">Healthcare providers and crisis professionals</p>
      
      <div className="space-y-3 mb-4">
        {contacts.map((contact, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.role}</p>
                <p className="text-sm text-blue-600">{contact.phone}</p>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="space-y-2">
          <input
            type="text"
            value={newContact.name}
            onChange={(e) => _setNewContact({ ...newContact, name: e.target.value })}
            placeholder="Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newContact.role}
            onChange={(e) => _setNewContact({ ...newContact, role: e.target.value })}
            placeholder="Role (e.g., Therapist, Psychiatrist)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            value={newContact.phone}
            onChange={(e) => _setNewContact({ ...newContact, phone: e.target.value })}
            placeholder="Phone number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Contact
          </button>
        </div>
      )}
    </div>
  );
}