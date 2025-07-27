import React from 'react';
import { Plus, X } from 'lucide-react';

const HashDiffConfigField = ({ value, onChange, error }) => {
  // Value should be an array of {name: string, columns: string[]}
  const hashDiffs = Array.isArray(value) ? value : [];

  const updateHashDiff = (index, field, newValue) => {
    const newHashDiffs = [...hashDiffs];
    newHashDiffs[index] = { ...newHashDiffs[index], [field]: newValue };
    onChange(newHashDiffs);
  };

  const updateColumn = (diffIndex, columnIndex, newValue) => {
    const newHashDiffs = [...hashDiffs];
    const newColumns = [...newHashDiffs[diffIndex].columns];
    newColumns[columnIndex] = newValue;
    newHashDiffs[diffIndex].columns = newColumns;
    onChange(newHashDiffs);
  };

  const addColumn = (diffIndex) => {
    const newHashDiffs = [...hashDiffs];
    newHashDiffs[diffIndex].columns.push('');
    onChange(newHashDiffs);
  };

  const removeColumn = (diffIndex, columnIndex) => {
    const newHashDiffs = [...hashDiffs];
    if (newHashDiffs[diffIndex].columns.length > 1) {
      newHashDiffs[diffIndex].columns.splice(columnIndex, 1);
      onChange(newHashDiffs);
    }
  };

  const addHashDiff = () => {
    onChange([...hashDiffs, { name: '', columns: [''] }]);
  };

  const removeHashDiff = (index) => {
    const newHashDiffs = hashDiffs.filter((_, i) => i !== index);
    onChange(newHashDiffs);
  };

  return (
    <div className="space-y-4">
      {hashDiffs.length === 0 && (
        <div className="text-gray-500 text-sm italic">
          No hash diffs configured. Click "Add Hash Diff" to create satellite hash diffs.
        </div>
      )}
      
      {hashDiffs.map((hashDiff, diffIndex) => (
        <div key={diffIndex} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Hash Diff {diffIndex + 1}</h4>
            <button
              type="button"
              className="remove-button"
              onClick={() => removeHashDiff(diffIndex)}
              title="Remove hash diff"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="form-label text-sm">Hash Diff Name</label>
              <input
                type="text"
                className="form-input"
                value={hashDiff.name || ''}
                onChange={(e) => updateHashDiff(diffIndex, 'name', e.target.value)}
                placeholder="hd_customer_details_s"
              />
            </div>
            
            <div>
              <label className="form-label text-sm">Columns for Hash Diff</label>
              {hashDiff.columns.map((column, columnIndex) => (
                <div key={columnIndex} className="multi-input">
                  <input
                    type="text"
                    className="form-input"
                    value={column || ''}
                    onChange={(e) => updateColumn(diffIndex, columnIndex, e.target.value)}
                    placeholder="C_NAME"
                  />
                  {hashDiff.columns.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeColumn(diffIndex, columnIndex)}
                      title="Remove column"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-button mt-2"
                onClick={() => addColumn(diffIndex)}
              >
                <Plus size={16} />
                Add Column
              </button>
            </div>
            
            <div className="text-xs text-gray-500">
              Columns: {hashDiff.columns.filter(col => col.trim() !== '').length}
            </div>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        className="add-button"
        onClick={addHashDiff}
      >
        <Plus size={16} />
        Add Hash Diff
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
};

export default HashDiffConfigField; 