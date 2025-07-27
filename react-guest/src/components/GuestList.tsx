import React, { useState, useEffect } from 'react';
import { Guest } from '../types/Guest';
import { apiService } from '../services/api';

interface GuestListProps {
  onCreateGuest: () => void;
  onEditGuest: (guest: Guest) => void;
}

export const GuestList: React.FC<GuestListProps> = ({ onCreateGuest, onEditGuest }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGuests();
      if (response.status === 'success') {
        setGuests(response.data || []);
      } else {
        setError(response.message || 'Failed to load guests');
      }
    } catch (err) {
      setError('Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (guest: Guest) => {
    if (!guest.id) return;
    
    try {
      const response = await apiService.checkoutGuest(guest.id);
      if (response.status === 'success') {
        loadGuests(); // Refresh the list
      } else {
        setError(response.message || 'Failed to check out guest');
      }
    } catch (err) {
      setError('Failed to check out guest');
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!guest.id) return;
    
    if (!window.confirm(`Are you sure you want to delete ${guest.g_first_name} ${guest.g_last_name}?`)) {
      return;
    }
    
    try {
      const response = await apiService.deleteGuest(guest.id);
      if (response.status === 'success') {
        loadGuests(); // Refresh the list
      } else {
        setError(response.message || 'Failed to delete guest');
      }
    } catch (err) {
      setError('Failed to delete guest');
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.g_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.g_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.badge_number.toString().includes(searchTerm)
  );

  const getVisitorTypeLabel = (gPaid: string) => {
    switch (gPaid) {
      case 'm': return 'Minor';
      case 'o': return 'Observer';
      case 's': return 'Spouse';
      case 'y': return 'Youth';
      case '1': return 'Paid Shooter';
      case 'a': return 'Shooter';
      default: return 'Shooter';
    }
  };

  const getPaymentStatusLabel = (gPaid: string) => {
    switch (gPaid) {
      case '1': return 'Paid';
      case 'm':
      case 'o':
      case 's':
      case 'y': return 'Free';
      default: return 'Unpaid';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">Loading guests...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Visitor Log</h2>
        <button
          onClick={onCreateGuest}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Add Visitor
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or badge number..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Badge #</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City, State</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Payment</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time In</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time Out</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredGuests.map((guest) => (
              <tr key={guest.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{guest.badge_number}</td>
                <td className="px-4 py-2 text-sm">
                  {guest.g_first_name} {guest.g_last_name}
                  {guest.g_yob && (
                    <span className="text-gray-500"> ({guest.g_yob})</span>
                  )}
                </td>
                <td className="px-4 py-2 text-sm">
                  {guest.g_city && guest.g_state ? `${guest.g_city}, ${guest.g_state}` : '-'}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getVisitorTypeLabel(guest.g_paid)}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    guest.g_paid === '1' ? 'bg-green-100 text-green-800' : 
                    ['m', 'o', 's', 'y'].includes(guest.g_paid) ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getPaymentStatusLabel(guest.g_paid)}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  {new Date(guest.time_in).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  {guest.time_out ? new Date(guest.time_out).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditGuest(guest)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    {!guest.time_out && (
                      <button
                        onClick={() => handleCheckout(guest)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Check Out
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(guest)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredGuests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No guests found matching your search.' : 'No guests found.'}
          </div>
        )}
      </div>
    </div>
  );
};
