import React from 'react';

interface SafetyAcknowledgmentProps {
  onAcknowledge: () => void;
  acknowledged: boolean;
}

export const SafetyAcknowledgment: React.FC<SafetyAcknowledgmentProps> = ({
  onAcknowledge,
  acknowledged
}) => {
  if (acknowledged) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-bold mb-4 text-yellow-800">Guest Safety Acknowledgement:</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700 mb-6">
        <li><strong>Guests or Responsible Adult agrees to AGC <a href="/waiver" target="_blank" className="text-blue-600 underline">Waiver of Liability</a>.</strong></li>
        <li>Assume every gun is always loaded.</li>
        <li>Never allow your firearm to point in any direction other than downrange (toward your target) or straight up.</li>
        <li>Keep your finger off the trigger until your sights are on the target and you are ready to shoot.</li>
        <li>Be sure of your target and what is beyond it.</li>
        <li>When "CEASE FIRE" is called, stop shooting immediately and allow the Badge Holder to make the firearm safe.</li>
        <li>During a Cease Fire, you are not to have any contact with any firearm. Step off the concrete pad and remain off. You can go with the Badge Holder downrange to change your targets. When you return from downrange, you shall remain off of the concrete pad.</li>
        <li>Your Badge Holder will be held accountable for any range rules you break. You are to be "closely supervised and monitored" by the Badge Holder who signed you in.</li>
        <li>If your Badge Holder needs to leave the firing line, make sure the firearm is made safe (unloaded, ECI inserted) step off the concrete pad and do not handle any firearms until your Badge Holder returns.</li>
      </ol>
      <p className="text-sm text-yellow-700 mb-4">
        Please ask your Guest to acknowledge the above statements and that they understand each statement. 
        If your guest is a minor, you can acknowledge for them.
      </p>
      <button 
        type="button"
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        onClick={onAcknowledge}
      >
        <span>👍</span>
        <span>I Agree</span>
      </button>
    </div>
  );
};
