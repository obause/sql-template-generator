import React from 'react';
import { Plus, X } from 'lucide-react';

const HashKeyConfigField = ({ value, onChange, error }) => {
  // Value should be an array of {name: string, business_keys: string[], single_key: boolean}
  const hashKeys = Array.isArray(value) ? value : [{ name: '', business_keys: [''], single_key: true }];

  const updateHashKey = (index, field, newValue) => {
    const newHashKeys = [...hashKeys];
    newHashKeys[index] = { ...newHashKeys[index], [field]: newValue };
    
    // Update single_key based on business_keys length
    if (field === 'business_keys') {
      newHashKeys[index].single_key = newValue.filter(key => key.trim() !== '').length === 1;
    }
    
    onChange(newHashKeys);
  };

  const updateBusinessKey = (hashIndex, keyIndex, newValue) => {
    const newHashKeys = [...hashKeys];
    const newBusinessKeys = [...newHashKeys[hashIndex].business_keys];
    newBusinessKeys[keyIndex] = newValue;
    newHashKeys[hashIndex].business_keys = newBusinessKeys;
    newHashKeys[hashIndex].single_key = newBusinessKeys.filter(key => key.trim() !== '').length === 1;
    onChange(newHashKeys);
  };

  const addBusinessKey = (hashIndex) => {
    const newHashKeys = [...hashKeys];
    newHashKeys[hashIndex].business_keys.push('');
    newHashKeys[hashIndex].single_key = false;
    onChange(newHashKeys);
  };

  const removeBusinessKey = (hashIndex, keyIndex) => {
    const newHashKeys = [...hashKeys];
    if (newHashKeys[hashIndex].business_keys.length > 1) {
      newHashKeys[hashIndex].business_keys.splice(keyIndex, 1);
      newHashKeys[hashIndex].single_key = newHashKeys[hashIndex].business_keys.filter(key => key.trim() !== '').length === 1;
      onChange(newHashKeys);
    }
  };

  const addHashKey = () => {
    onChange([...hashKeys, { name: '', business_keys: [''], single_key: true }]);
  };

  const removeHashKey = (index) => {
    if (hashKeys.length > 1) {
      const newHashKeys = hashKeys.filter((_, i) => i !== index);
      onChange(newHashKeys);
    }
  };

  return (
    <div className="space-y-4">
      {hashKeys.map((hashKey, hashIndex) => (
        <div key={hashIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Hash Key {hashIndex + 1}</h4>
            {hashKeys.length > 1 && (
              <button
                type="button"
                className="remove-button"
                onClick={() => removeHashKey(hashIndex)}
                title="Remove hash key"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="form-label text-sm">Hash Key Name</label>
              <input
                type="text"
                className="form-input"
                value={hashKey.name || ''}
                onChange={(e) => updateHashKey(hashIndex, 'name', e.target.value)}
                placeholder="hk_customer_h"
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Business Key Columns</label>
              {hashKey.business_keys.map((businessKey, keyIndex) => (
                <div key={keyIndex} className="multi-input">
                  <input
                    type="text"
                    className="form-input"
                    value={businessKey || ''}
                    onChange={(e) => updateBusinessKey(hashIndex, keyIndex, e.target.value)}
                    placeholder="C_CUSTKEY"
                  />
                  {hashKey.business_keys.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeBusinessKey(hashIndex, keyIndex)}
                      title="Remove business key"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-button mt-2"
                onClick={() => addBusinessKey(hashIndex)}
              >
                <Plus size={16} />
                Add Business Key
              </button>
            </div>
            
            <div className="text-xs text-gray-500">
              Type: {hashKey.single_key ? 'Single Key' : 'Composite Key'} 
              ({hashKey.business_keys.filter(key => key.trim() !== '').length} keys)
            </div>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        className="add-button"
        onClick={addHashKey}
      >
        <Plus size={16} />
        Add Hash Key
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
};

export default HashKeyConfigField; 