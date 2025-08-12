import React, { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import SelectMenu from './SelectMenu.jsx';

export default function SatellitesConfigField({ value, onChange, help, instances = [] }) {
  const satellites = Array.isArray(value) ? value : [{ table: '', alias: '' }];

  const satelliteInstances = useMemo(
    () => (instances || []).filter(inst => inst.type === 'satellite' || inst.type === 'multi_active_satellite'),
    [instances]
  );
  const satelliteOptions = useMemo(() => satelliteInstances.map(inst => {
    const v = inst.values || {};
    const fqn = v.schema_name && v.schema_name.trim() !== '' ? `${v.schema_name}.${v.table_name}` : v.table_name;
    return { id: inst.id, label: fqn || inst.name, fqn, tableName: v.table_name };
  }).filter(o => o.fqn), [satelliteInstances]);

  const updateItem = (index, field, newVal) => {
    const next = satellites.map((s, i) => (i === index ? { ...s, [field]: newVal } : s));
    onChange(next);
  };

  const addItem = () => {
    onChange([...satellites, { table: '', alias: '' }]);
  };

  const removeItem = (index) => {
    if (satellites.length <= 1) return;
    onChange(satellites.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {satellites.map((sat, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-start">
          <div className="md:col-span-4">
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Fully qualified satellite table (e.g., schema.satellite)"
                value={sat.table || ''}
                onChange={(e) => updateItem(index, 'table', e.target.value)}
                title="Full table name of the satellite"
              />
              <SelectMenu
                options={satelliteOptions.map(o => ({ value: o.fqn, label: o.label }))}
                value={satelliteOptions.find(o => o.fqn === sat.table)?.fqn || ''}
                onChange={(val) => {
                  const picked = satelliteOptions.find(o => o.fqn === val);
                  if (!picked) return;
                  // Set table, and if alias empty, initialize alias to table name
                  const aliasIsEmpty = !sat.alias || sat.alias.trim() === '';
                  const next = satellites.map((s, i) => i === index ? {
                    ...s,
                    table: picked.fqn,
                    alias: aliasIsEmpty ? (picked.tableName || picked.fqn) : s.alias,
                  } : s);
                  onChange(next);
                }}
                buttonClassName="w-56"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Alias (e.g., customer_n_s)"
              value={sat.alias || ''}
              onChange={(e) => updateItem(index, 'alias', e.target.value)}
              title="Alias used in SQL and output column suffixes"
            />
          </div>
          <div className="md:col-span-1 flex items-center">
            {satellites.length > 1 && (
              <button type="button" className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-500" onClick={() => removeItem(index)} title="Remove satellite">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500" onClick={addItem} title="Add satellite">
          <Plus size={16} />
          Add Satellite
        </button>
        {help && <div className="text-gray-500 text-xs">{help}</div>}
      </div>
    </div>
  );
}


