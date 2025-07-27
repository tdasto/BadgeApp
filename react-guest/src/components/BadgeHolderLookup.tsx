import React, { useState } from 'react';
import { BadgeHolder } from '../types/Guest';
import { apiService } from '../services/api';

interface BadgeHolderLookupProps {
  onBadgeHolderFound: (holder: BadgeHolder) => void;
  disabled?: boolean;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}

export const BadgeHolderLookup: React.FC<BadgeHolderLookupProps> = ({
  onBadgeHolderFound,
  disabled = false,
  value,
  onChange,
  error
}) => {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<BadgeHolder | null>(null);

  const handleBadgeNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const badgeNumber = parseInt(e.target.value);
    onChange(badgeNumber);
    
    if (!badgeNumber || badgeNumber <= 0) {
      setSearchError(null);
      setMemberInfo(null);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      const response = await apiService.getBadgeHolder(badgeNumber);
      
      if (response.status === 'success' && response.data) {
        setMemberInfo(response.data);
        onBadgeHolderFound(response.data);
        setSearchError(null);
      } else {
        setSearchError('Sorry! Could not find a Badge Holder');
        setMemberInfo(null);
      }
    } catch (err) {
      setSearchError('Error looking up badge holder');
      setMemberInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Badge Number *
        </label>
        <input
          type="number"
          className={`w-full px-3 py-2 border rounded-md ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          value={value || ''}
          onChange={handleBadgeNumberChange}
          disabled={disabled}
          placeholder="Enter badge number"
        />
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
        {loading && (
          <p className="text-blue-500 text-sm mt-1">Looking up badge holder...</p>
        )}
        {searchError && (
          <p className="text-red-500 text-sm mt-1 font-bold">{searchError}</p>
        )}
      </div>

      {memberInfo && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-800 mb-2">Badge Holder Found:</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Name:</strong> {memberInfo.first_name} {memberInfo.last_name}</p>
            <p><strong>Address:</strong> {memberInfo.address}</p>
            <p><strong>City, State:</strong> {memberInfo.city}, {memberInfo.state}</p>
            <p><strong>ZIP:</strong> {memberInfo.zip}</p>
          </div>
        </div>
      )}
    </div>
  );
};
