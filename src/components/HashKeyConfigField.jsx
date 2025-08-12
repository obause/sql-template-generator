import React from 'react';
import { Plus, X } from 'lucide-react';

const HashKeyConfigField = ({ value, onChange, error, sourceColumnOptions = [] }) => {
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
        <div key={hashIndex} className="rounded-md border p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">Hash Key {hashIndex + 1}</h4>
            {hashKeys.length > 1 && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-500"
                onClick={() => removeHashKey(hashIndex)}
                title="Remove hash key"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hash Key Name</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={hashKey.name || ''}
                onChange={(e) => updateHashKey(hashIndex, 'name', e.target.value)}
                placeholder="hk_customer_h"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Key Columns</label>
              {hashKey.business_keys.map((businessKey, keyIndex) => (
                <div key={keyIndex} className="flex items-center gap-2 mb-2">
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={businessKey || ''}
                      onChange={(e) => updateBusinessKey(hashIndex, keyIndex, e.target.value)}
                      placeholder="C_CUSTKEY"
                      list={`hk-bk-${hashIndex}-${keyIndex}`}
                    />
                    <select
                      className="rounded-md border px-3 py-2 text-sm"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) updateBusinessKey(hashIndex, keyIndex, e.target.value);
                      }}
                    >
                      <option value="">Pick column…</option>
                      {sourceColumnOptions.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <datalist id={`hk-bk-${hashIndex}-${keyIndex}`}>
                      {sourceColumnOptions.map(col => (<option key={col} value={col} />))}
                    </datalist>
                  </div>
                  {hashKey.business_keys.length > 1 && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-2 text-xs hover:bg-red-500"
                      onClick={() => removeBusinessKey(hashIndex, keyIndex)}
                      title="Remove business key"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500 mt-2"
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
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500"
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