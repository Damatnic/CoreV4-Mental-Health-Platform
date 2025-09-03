import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, User, Star, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { secureStorage } from '../../services/security/SecureLocalStorage';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  lastContacted?: string;
  notes?: string;
}

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [__showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    notes: ''
  });

  // Load contacts from localStorage on mount
  useEffect(() => {
    const _savedContacts = secureStorage.getItem('emergencyContacts');
    if (_savedContacts) {
      setContacts(JSON.parse(_savedContacts));
    } else {
      // Set default emergency contacts if none exist
      const _defaultContacts: EmergencyContact[] = [
        {
          id: 'default-988',
          name: '988 Suicide & Crisis Lifeline',
          phone: '988',
          relationship: 'Crisis Support',
          isPrimary: true,
          notes: 'Available 24/7 for crisis support'
        },
        {
          id: 'default-crisis-text',
          name: 'Crisis Text Line',
          phone: '741741',
          relationship: 'Text Support',
          isPrimary: true,
          notes: 'Text HOME to 741741'
        }
      ];
      setContacts(_defaultContacts);
      secureStorage.setItem('emergencyContacts', JSON.stringify(_defaultContacts));
    }
  }, []);

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    if (contacts.length > 0) {
      secureStorage.setItem('emergencyContacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  const handleAddContact = () => {
    if (!formData.name || !formData.phone) return;

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: formData.name,
      phone: formData.phone.replace(/\D/g, ''), // Remove non-numeric characters
      relationship: formData.relationship,
      isPrimary: contacts.length === 0,
      notes: formData.notes
    };

    setContacts([...contacts, newContact]);
    setFormData({ name: '', phone: '', relationship: '', notes: '' });
    setShowAddForm(false);
  };

  const handleUpdateContact = () => {
    if (!editingContact || !formData.name || !formData.phone) return;

    const _updatedContacts = contacts.map(contact =>
      contact.id === editingContact.id
        ? {
            ...contact,
            name: formData.name,
            phone: formData.phone.replace(/\D/g, ''),
            relationship: formData.relationship,
            notes: formData.notes
          }
        : contact
    );

    setContacts(_updatedContacts);
    setEditingContact(null);
    setFormData({ name: '', phone: '', relationship: '', notes: '' });
  };

  const handleDeleteContact = (id: string) => {
    // Don't allow deletion of default crisis lines
    if (id.startsWith('default-')) {
      toast.error('Default crisis support contacts cannot be deleted.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Contact deleted successfully');
    }
  };

  const handleCallContact = (contact: EmergencyContact) => {
    // Update last contacted time
    const _updatedContacts = contacts.map(c =>
      c.id === contact.id
        ? { ...c, lastContacted: new Date().toISOString() }
        : c
    );
    setContacts(_updatedContacts);

    // Initiate call
    window.location.href = `tel:${contact.phone}`;
  };

  const togglePrimary = (id: string) => {
    const _updatedContacts = contacts.map(contact =>
      contact.id === id
        ? { ...contact, isPrimary: !contact.isPrimary }
        : contact
    );
    setContacts(_updatedContacts);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format US phone numbers
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    } else if (phone.length === 11 && phone.startsWith('1')) {
      return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emergency Contacts</h2>
          <p className="text-gray-600 mt-1">Quick access to your support network</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contact List */}
      <div className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={`border rounded-lg p-4 ${
              contact.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    {contact.isPrimary && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{contact.relationship}</p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatPhoneNumber(contact.phone)}
                  </p>
                  {contact.notes && (
                    <p className="text-sm text-gray-500 mt-1">{contact.notes}</p>
                  )}
                  {contact.lastContacted && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-400">
                        Last contacted: {new Date(contact.lastContacted).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCallContact(contact)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  aria-label={`Call ${contact.name}`}
                >
                  <Phone className="h-4 w-4" />
                  <span>Call</span>
                </button>
                {!contact.id.startsWith('default-') && (
                  <>
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setFormData({
                          name: contact.name,
                          phone: contact.phone,
                          relationship: contact.relationship,
                          notes: contact.notes || ''
                        });
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={`Edit ${contact.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => togglePrimary(contact.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={`Toggle primary for ${contact.name}`}
                    >
                      <Star className={`h-4 w-4 ${contact.isPrimary ? 'fill-current text-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Delete ${contact.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Contact Form */}
      {(showAddForm || editingContact) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={() => {
                setShowAddForm(false);
                setEditingContact(null);
                setFormData({ name: '', phone: '', relationship: '', notes: '' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowAddForm(false);
                  setEditingContact(null);
                  setFormData({ name: '', phone: '', relationship: '', notes: '' });
                }
              }}
              role="button"
              tabIndex={0}
            ></div>
            <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label htmlFor="contact-relationship" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    id="contact-relationship"
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Friend, Family, Therapist, etc."
                  />
                </div>
                <div>
                  <label htmlFor="contact-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="contact-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional information..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingContact ? 'Update' : 'Add'} Contact
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingContact(null);
                    setFormData({ name: '', phone: '', relationship: '', notes: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}