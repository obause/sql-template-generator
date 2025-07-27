import React from 'react';
import { Plus, X } from 'lucide-react';
import HashKeyConfigField from './HashKeyConfigField.jsx';
import HashDiffConfigField from './HashDiffConfigField.jsx';

const FormField = ({ field, value, onChange, error }) => {
  const handleSingleChange = (e) => {
    onChange(field.name, e.target.value);
  };

  const handleCheckboxChange = (e) => {
    onChange(field.name, e.target.checked);
  };

  const handleComplexChange = (newValue) => {
    onChange(field.name, newValue);
  };

  const handleMultiChange = (index, newValue) => {
    const newArray = [...value];
    newArray[index] = newValue;
    onChange(field.name, newArray);
  };

  const addMultiField = () => {
    onChange(field.name, [...value, '']);
  };

  const removeMultiField = (index) => {
    if (value.length > 1) {
      const newArray = value.filter((_, i) => i !== index);
      onChange(field.name, newArray);
    }
  };

  const renderCheckbox = () => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        className="form-checkbox h-4 w-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        checked={value || false}
        onChange={handleCheckboxChange}
      />
      <span className="text-sm text-gray-600">{field.help}</span>
    </label>
  );

  const renderSingleInput = () => (
    <input
      type="text"
      className={`form-input ${error ? 'border-red-500' : ''}`}
      value={value || ''}
      onChange={handleSingleChange}
      placeholder={field.placeholder}
      title={field.help}
    />
  );

  const renderMultiInput = () => {
    const arrayValue = Array.isArray(value) ? value : [''];
    
    return (
      <div>
        {arrayValue.map((item, index) => (
          <div key={index} className="multi-input">
            <input
              type="text"
              className={`form-input ${error ? 'border-red-500' : ''}`}
              value={item || ''}
              onChange={(e) => handleMultiChange(index, e.target.value)}
              placeholder={field.placeholder}
              title={field.help}
            />
            {arrayValue.length > 1 && (
              <button
                type="button"
                className="remove-button"
                onClick={() => removeMultiField(index)}
                title="Remove field"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="add-button"
          onClick={addMultiField}
          title="Add another field"
        >
          <Plus size={16} />
          Add {field.label}
        </button>
      </div>
    );
  };

  const renderHashKeyConfig = () => (
    <HashKeyConfigField
      value={value}
      onChange={handleComplexChange}
      error={error}
    />
  );

  const renderHashDiffConfig = () => (
    <HashDiffConfigField
      value={value}
      onChange={handleComplexChange}
      error={error}
    />
  );

  const renderField = () => {
    switch (field.type) {
      case 'checkbox':
        return renderCheckbox();
      case 'multi-text':
        return renderMultiInput();
      case 'hashkey-config':
        return renderHashKeyConfig();
      case 'hashdiff-config':
        return renderHashDiffConfig();
      default:
        return renderSingleInput();
    }
  };

  return (
    <div className="form-group">
      {field.type !== 'checkbox' && (
        <label className="form-label">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
      
      {field.help && !error && field.type !== 'checkbox' && (
        <div className="text-gray-500 text-xs mt-1">{field.help}</div>
      )}
    </div>
  );
};

export default FormField; 