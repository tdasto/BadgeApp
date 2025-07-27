import React, { useState, useEffect } from 'react';
import { Guest, BadgeHolder } from '../types/Guest';
import { apiService } from '../services/api';
import { SafetyAcknowledgment } from './SafetyAcknowledgment';
import { VisitorTypeSelector } from './VisitorTypeSelector';
import { PaymentForm } from './PaymentForm';
import { BadgeHolderLookup } from './BadgeHolderLookup';

interface GuestFormProps {
  guest?: Guest | null;
  onSave: () => void;
  onCancel: () => void;
}

export const GuestForm: React.FC<GuestFormProps> = ({ guest, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Guest>>({
    badge_number: 0,
    g_first_name: '',
    g_last_name: '',
    g_city: '',
    g_state: '',
    g_yob: new Date().getFullYear() - 30,
    g_paid: '0',
    time_in: new Date().toISOString().slice(0, 19).replace('T', ' '),
    guest_count: 1,
    payment_type: 'cash',
    amount_due: 27.00, // $25 + 8% tax
    tax: 0.08
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [badgeHolder, setBadgeHolder] = useState<BadgeHolder | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const guestPrice = 25.00;

  useEffect(() => {
    if (guest) {
      setFormData(guest);
      setSafetyAcknowledged(true);
    }
  }, [guest]);

  useEffect(() => {
    const totalAmount = calculateAmount();
    setFormData(prev => ({ ...prev, amount_due: totalAmount }));
  }, [formData.guest_count, formData.g_paid]);

  const calculateAmount = () => {
    if (['m', 'o', 's', 'y'].includes(formData.g_paid || '')) {
      return 0;
    }
    const subtotal = guestPrice * (formData.guest_count || 1);
    const tax = subtotal * 0.08;
    return Number((subtotal + tax).toFixed(2));
  };

  const handleInputChange = (field: keyof Guest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBadgeHolderFound = (holder: BadgeHolder) => {
    setBadgeHolder(holder);
    setFormData(prev => ({ ...prev, badge_number: holder.badge_number }));
  };

  const handleVisitorTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, g_paid: type }));
    
    if (['m', 'o', 's', 'y'].includes(type)) {
      setFormData(prev => ({
        ...prev,
        guest_count: 1,
        payment_type: 'cash',
        amount_due: 0
      }));
      setShowPayment(false);
    } else {
      setShowPayment(true);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.g_first_name?.trim()) {
      newErrors.g_first_name = 'First name is required';
    }
    if (!formData.g_last_name?.trim()) {
      newErrors.g_last_name = 'Last name is required';
    }
    if (!formData.badge_number || formData.badge_number <= 0) {
      newErrors.badge_number = 'Valid badge number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guest && !safetyAcknowledged) {
      setError('Please acknowledge the safety rules before proceeding.');
      return;
    }

    if (!validateForm()) {
      setError('Please fix the errors below.');
      return;
    }

    if (formData.payment_type === 'creditnow' && formData.g_paid === '0') {
      setError('Please process payment before saving.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = guest 
        ? await apiService.updateGuest(guest.id!, formData)
        : await apiService.createGuest(formData);

      if (response.status === 'success') {
        setSuccess(guest ? 'Guest updated successfully!' : 'Guest created successfully!');
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        setError(response.message || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to save guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setFormData(prev => ({
      ...prev,
      g_paid: '1',
      cc_x_id: transactionId
    }));
    setSuccess('Payment processed successfully!');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-3xl font-bold mb-6">{guest ? 'Update Visitor' : 'Add Visitor'}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <BadgeHolderLookup
                onBadgeHolderFound={handleBadgeHolderFound}
                disabled={!!guest}
                value={formData.badge_number}
                onChange={(value) => handleInputChange('badge_number', value)}
                error={errors.badge_number}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time In
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  value={formData.time_in || ''}
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest First Name *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.g_first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.g_first_name || ''}
                  onChange={(e) => handleInputChange('g_first_name', e.target.value)}
                />
                {errors.g_first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.g_first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Last Name *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.g_last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.g_last_name || ''}
                  onChange={(e) => handleInputChange('g_last_name', e.target.value)}
                />
                {errors.g_last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.g_last_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year of Birth
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.g_yob || ''}
                  onChange={(e) => handleInputChange('g_yob', parseInt(e.target.value))}
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.g_city || ''}
                  onChange={(e) => handleInputChange('g_city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.g_state || ''}
                  onChange={(e) => handleInputChange('g_state', e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
            </div>

            <VisitorTypeSelector
              selectedType={formData.g_paid || '0'}
              onTypeChange={handleVisitorTypeChange}
              disabled={!!guest}
            />

            {!guest && (
              <SafetyAcknowledgment
                onAcknowledge={() => setSafetyAcknowledged(true)}
                acknowledged={safetyAcknowledged}
              />
            )}
          </div>

          {!guest && showPayment && (
            <div className="lg:col-span-1">
              <PaymentForm
                guestPrice={guestPrice}
                guestCount={formData.guest_count || 1}
                formData={formData}
                onFormDataChange={setFormData}
                badgeHolder={badgeHolder}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6" style={{ display: safetyAcknowledged || !!guest ? 'flex' : 'none' }}>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            disabled={loading || (!safetyAcknowledged && !guest)}
          >
            {loading ? 'Saving...' : (guest ? 'Update' : 'Register')}
          </button>
        </div>
      </form>
    </div>
  );
};
