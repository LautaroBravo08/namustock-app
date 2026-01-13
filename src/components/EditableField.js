import React, { useState } from 'react';
import { Edit, Check, X } from 'lucide-react';

const EditableField = ({ label, value, onSave, inputType = 'text', children, readOnly = false, suggestions = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const datalistId = `suggestions-for-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="bg-gray-800 p-3 rounded-lg">
      <div className="flex justify-between items-center mb-1">
        <p className="text-gray-400 text-sm">{label}</p>
        {!isEditing && !readOnly && (
          <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white">
            <Edit className="h-4 w-4" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div>
          {children ? (
            React.cloneElement(children, { value: currentValue, onChange: (e) => setCurrentValue(e.target.value) })
          ) : (
            <>
              <input
                type={inputType}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                list={suggestions.length > 0 ? datalistId : undefined}
              />
              {suggestions.length > 0 && (
                <datalist id={datalistId}>
                  {suggestions.map((suggestion, index) => (
                    <option key={index} value={suggestion} />
                  ))}
                </datalist>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={handleSave} className="text-green-400 hover:text-white">
              <Check className="h-5 w-5" />
            </button>
            <button onClick={handleCancel} className="text-red-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white font-semibold break-words">{value}</p>
      ) }
    </div>
  );
};

export default EditableField;