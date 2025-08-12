import React from 'react';
import { Plus, X } from 'lucide-react';

const HashDiffConfigField = ({ value, onChange, error, sourceColumnOptions = [] }) => {
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
        <div key={diffIndex} className="rounded-md border p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">Hash Diff {diffIndex + 1}</h4>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-500"
              onClick={() => removeHashDiff(diffIndex)}
              title="Remove hash diff"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hash Diff Name</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={hashDiff.name || ''}
                onChange={(e) => updateHashDiff(diffIndex, 'name', e.target.value)}
                placeholder="hd_customer_details_s"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns for Hash Diff</label>
              {hashDiff.columns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex items-center gap-2 mb-2">
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={column || ''}
                      onChange={(e) => updateColumn(diffIndex, columnIndex, e.target.value)}
                      placeholder="C_NAME"
                      list={`hd-col-${diffIndex}-${columnIndex}`}
                    />
                    <select
                      className="rounded-md border px-3 py-2 text-sm"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) updateColumn(diffIndex, columnIndex, e.target.value);
                      }}
                    >
                      <option value="">Pick column…</option>
                      {sourceColumnOptions.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <datalist id={`hd-col-${diffIndex}-${columnIndex}`}>
                      {sourceColumnOptions.map(col => (<option key={col} value={col} />))}
                    </datalist>
                  </div>
                  {hashDiff.columns.length > 1 && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-2 text-xs hover:bg-red-500"
                      onClick={() => removeColumn(diffIndex, columnIndex)}
                      title="Remove column"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500 mt-2"
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
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500"
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