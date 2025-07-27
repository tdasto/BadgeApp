import React, { useState, useEffect } from 'react';
import { Guest, BadgeHolder } from '../types/Guest';
import { apiService } from '../services/api';

interface PaymentFormProps {
  guestPrice: number;
  guestCount: number;
  formData: Partial<Guest>;
  onFormDataChange: (data: Partial<Guest>) => void;
  badgeHolder: BadgeHolder | null;
  onPaymentSuccess: (transactionId: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  guestPrice,
  guestCount,
  formData,
  onFormDataChange,
  badgeHolder,
  onPaymentSuccess
}) => {
  const [processing, setProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [useGuestInfo, setUseGuestInfo] = useState(true);

  useEffect(() => {
    const total = guestPrice * guestCount;
    const tax = total * 0.08;
    onFormDataChange({
      ...formData,
      amount_due: Number((total + tax).toFixed(2)),
      tax: Number(tax.toFixed(2))
    });
  }, [guestCount, guestPrice]);

  const handleInputChange = (field: keyof Guest, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleGuestCountChange = (count: number) => {
    handleInputChange('guest_count', count);
  };

  const handlePaymentTypeChange = (type: string) => {
    handleInputChange('payment_type', type);
    if (type !== 'creditnow') {
      setPaymentMessage('');
    }
  };

  const handleUseGuestInfo = () => {
    setUseGuestInfo(true);
    const firstName = formData.g_first_name || '';
    const lastName = formData.g_last_name || '';
    const city = formData.g_city || '';
    const state = formData.g_state || '';
    
    onFormDataChange({
      ...formData,
      cc_name: `${firstName} ${lastName}`,
      cc_city: city,
      cc_state: state
    });
  };

  const handleUseMemberInfo = () => {
    setUseGuestInfo(false);
    if (badgeHolder) {
      onFormDataChange({
        ...formData,
        cc_name: `${badgeHolder.first_name} ${badgeHolder.last_name}`,
        cc_address: badgeHolder.address,
        cc_city: badgeHolder.city,
        cc_state: badgeHolder.state,
        cc_zip: badgeHolder.zip
      });
    }
  };

  const processPayment = async () => {
    setProcessing(true);
    setPaymentMessage('Processing...');

    try {
      const paymentData = {
        Guest: {
          cc_name: formData.cc_name,
          cc_address: formData.cc_address,
          cc_city: formData.cc_city,
          cc_state: formData.cc_state,
          cc_zip: formData.cc_zip,
          cc_num: formData.cc_num,
          cc_cvc: formData.cc_cvc,
          cc_exp_mo: formData.cc_exp_mo,
          cc_exp_yr: formData.cc_exp_yr,
          amount_due: formData.amount_due,
          tax: formData.tax
        }
      };

      const response = await apiService.processPayment(paymentData);

      if (response.status === 'success' && response.data?.message?.status === 'CAPTURED') {
        setPaymentMessage(`Card Captured, Auth Code: ${response.data.message.authCode}`);
        onPaymentSuccess(response.data.message.id);
      } else {
        setPaymentMessage(response.message || 'Payment failed');
      }
    } catch (error) {
      setPaymentMessage('Payment processing error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join('-');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    handleInputChange('cc_num', formatted);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">${guestPrice} per Shooter</h3>
      <hr className="mb-4" />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shooter Count
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={guestCount}
            onChange={(e) => handleGuestCountChange(Number(e.target.value))}
          >
            {Array.from({ length: 19 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Due
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            value={formData.amount_due || 0}
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.payment_type || 'cash'}
            onChange={(e) => handlePaymentTypeChange(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="creditnow">Credit Card</option>
          </select>
        </div>

        {formData.payment_type === 'creditnow' && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="who_pays"
                  checked={useGuestInfo}
                  onChange={handleUseGuestInfo}
                  className="mr-2"
                />
                Guest info
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="who_pays"
                  checked={!useGuestInfo}
                  onChange={handleUseMemberInfo}
                  className="mr-2"
                />
                Member info
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name on Card *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_name || ''}
                  onChange={(e) => handleInputChange('cc_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_zip || ''}
                  onChange={(e) => handleInputChange('cc_zip', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.cc_address || ''}
                onChange={(e) => handleInputChange('cc_address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_city || ''}
                  onChange={(e) => handleInputChange('cc_city', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_state || ''}
                  onChange={(e) => handleInputChange('cc_state', e.target.value.toUpperCase())}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.cc_num || ''}
                onChange={handleCardNumberChange}
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exp Month *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_exp_mo || ''}
                  onChange={(e) => handleInputChange('cc_exp_mo', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = String(i + 1).padStart(2, '0');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return (
                      <option key={month} value={month}>
                        {month} {monthNames[i]}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exp Year *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_exp_yr || ''}
                  onChange={(e) => handleInputChange('cc_exp_yr', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {Array.from({ length: 26 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cc_cvc || ''}
                  onChange={(e) => handleInputChange('cc_cvc', e.target.value)}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                onClick={processPayment}
                disabled={processing}
              >
                <span>💳</span>
                <span>{processing ? 'Processing...' : 'Process Payment'}</span>
              </button>
            </div>

            {paymentMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800">{paymentMessage}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
