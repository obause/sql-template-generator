import React from 'react';
import { Plus, X } from 'lucide-react';

const ColumnConfigField = ({ value = [], onChange, placeholder, help }) => {
  const addColumn = () => {
    const newColumn = { name: '', datatype: 'string' };
    onChange([...value, newColumn]);
  };

  const removeColumn = (index) => {
    const newColumns = value.filter((_, i) => i !== index);
    onChange(newColumns);
  };

  const updateColumn = (index, field, newValue) => {
    const newColumns = value.map((column, i) => 
      i === index ? { ...column, [field]: newValue } : column
    );
    onChange(newColumns);
  };

  return (
    <div className="space-y-3">
      {help && <div className="text-xs text-gray-500">{help}</div>}

      {value.map((column, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              placeholder="Column name (e.g., C_CUSTKEY)"
              value={column.name || ''}
              onChange={(e) => updateColumn(index, 'name', e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <select
              value={column.datatype || 'string'}
              onChange={(e) => updateColumn(index, 'datatype', e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="string">String</option>
              <option value="numeric">Numeric</option>
              <option value="timestamp">Timestamp</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => removeColumn(index)}
            className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-2 text-xs hover:bg-red-500"
            title="Remove column"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addColumn}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500"
      >
        <Plus size={16} />
        Add Column
      </button>
    </div>
  );
};

export default ColumnConfigField; 