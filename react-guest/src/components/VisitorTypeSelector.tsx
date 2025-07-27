import React from 'react';

interface VisitorTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  disabled?: boolean;
}

export const VisitorTypeSelector: React.FC<VisitorTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onTypeChange(type);
    } else if (selectedType === type) {
      onTypeChange('0'); // Default to shooter
    }
  };

  const visitorTypes = [
    { id: '0', label: 'Shooter', value: '0' },
    { id: 's', label: 'Spouse', value: 's' },
    { id: 'y', label: 'Jr. Event', value: 'y' },
    { id: 'm', label: 'Minor (<18yr)', value: 'm' },
    { id: 'o', label: 'Observer', value: 'o' }
  ];

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'm': return 'Guest is a Minor';
      case 'o': return 'Guest is an Observer';
      case 's': return 'Guest is a Spouse';
      case 'y': return 'Guest is a Youth Participant';
      default: return null;
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4">Type of Visitor?</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {visitorTypes.map((type) => (
          <div key={type.id} className="flex items-center">
            <input
              type="checkbox"
              id={`guest-is${type.id}`}
              checked={selectedType === type.value || (selectedType === 'a' && type.value === '0')}
              onChange={(e) => handleTypeChange(type.value, e.target.checked)}
              disabled={disabled}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`guest-is${type.id}`} className="text-sm font-medium text-gray-700">
              {type.label}
            </label>
          </div>
        ))}
      </div>

      {selectedType !== '0' && selectedType !== 'a' && selectedType !== '' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-800 font-medium">
            {getTypeDescription(selectedType)}
          </p>
        </div>
      )}
    </div>
  );
};
