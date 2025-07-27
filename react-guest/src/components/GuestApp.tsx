import React, { useState } from 'react';
import { GuestForm } from './GuestForm';
import { GuestList } from './GuestList';
import { Guest } from '../types/Guest';

export const GuestApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const handleCreateGuest = () => {
    setEditingGuest(null);
    setCurrentView('create');
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setEditingGuest(null);
    setCurrentView('list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <nav className="bg-white shadow-sm rounded-lg mb-6 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Guest Management</h1>
            <div className="flex space-x-4">
              <button 
                className={`px-4 py-2 rounded-md ${
                  currentView === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setCurrentView('list')}
              >
                Guest List
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${
                  currentView === 'create' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                onClick={handleCreateGuest}
              >
                Add Guest
              </button>
            </div>
          </div>
        </nav>

        {currentView === 'list' && (
          <GuestList 
            onCreateGuest={handleCreateGuest}
            onEditGuest={handleEditGuest}
          />
        )}

        {(currentView === 'create' || currentView === 'edit') && (
          <GuestForm 
            guest={editingGuest}
            onSave={handleBackToList}
            onCancel={handleBackToList}
          />
        )}
      </div>
    </div>
  );
};
