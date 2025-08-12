import React, { useMemo } from 'react';
import { Plus, X } from 'lucide-react';

export default function LinkHubsConfigField({ value, onChange, help, instances = [], allValues = {} }) {
  const hubs = Array.isArray(value) ? value : [{ hub_hashkey_name: '', hub_source_column: '' }];

  const stageInstances = useMemo(
    () => (instances || []).filter(inst => inst.type === 'stage_view'),
    [instances]
  );
  const stageOptions = useMemo(() => stageInstances.map(inst => {
    const v = inst.values || {};
    const hashes = Array.isArray(v.hashkeys) ? v.hashkeys.map(h => h?.name).filter(Boolean) : [];
    return { id: inst.id, label: inst.name || v.view_name, hashkeys: hashes };
  }), [stageInstances]);

  const updateHub = (index, field, newVal) => {
    const next = hubs.map((h, i) => (i === index ? { ...h, [field]: newVal } : h));
    // Auto-fill target hub hashkey name first time when selecting source column
    if (field === 'hub_source_column') {
      const current = next[index] || {};
      if (!current.hub_hashkey_name || String(current.hub_hashkey_name).trim() === '') {
        next[index] = { ...current, hub_hashkey_name: newVal };
      }
    }
    onChange(next);
  };

  const addHub = () => {
    onChange([...hubs, { hub_hashkey_name: '', hub_source_column: '' }]);
  };

  const removeHub = (index) => {
    if (hubs.length <= 1) return;
    onChange(hubs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {hubs.map((hub, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Target hub hashkey column name (e.g., hk_customer_h)"
              value={hub.hub_hashkey_name || ''}
              onChange={(e) => updateHub(index, 'hub_hashkey_name', e.target.value)}
              title="Target hub hashkey column name in the link table"
              list={`link-target-hk-${index}`}
            />
            <datalist id={`link-target-hk-${index}`}>
              {(value || []).map(h => h?.hub_hashkey_name).filter(Boolean).map((n, i) => (
                <option key={`${n}-${i}`} value={n} />
              ))}
            </datalist>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Source hub hashkey column (e.g., hk_customer_h)"
              value={hub.hub_source_column || ''}
              onChange={(e) => updateHub(index, 'hub_source_column', e.target.value)}
              title="Column in the source providing this hub's hashkey"
              list={`link-source-hk-${index}`}
            />
            <select
              className="form-input"
              value=""
              onChange={(e) => {
                const all = stageOptions.flatMap(o => o.hashkeys);
                const sel = all.find(h => h === e.target.value);
                if (sel) updateHub(index, 'hub_source_column', sel);
              }}
            >
              <option value="">Pick from stages…</option>
              {stageOptions.map(opt => (
                <optgroup key={opt.id} label={opt.label}>
                  {opt.hashkeys.map(h => (<option key={`${opt.id}-${h}`} value={h}>{h}</option>))}
                </optgroup>
              ))}
            </select>
            <datalist id={`link-source-hk-${index}`}>
              {stageOptions.flatMap(o => o.hashkeys).map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {hubs.length > 1 && (
              <button type="button" className="remove-button" onClick={() => removeHub(index)} title="Remove hub">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" className="add-button" onClick={addHub} title="Add related hub">
          <Plus size={16} />
          Add Related Hub
        </button>
        {help && <div className="text-gray-500 text-xs">{help}</div>}
      </div>
    </div>
  );
}


