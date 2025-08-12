import React, { useMemo } from 'react';
import { Plus, X } from 'lucide-react';

const HubSourcesConfigField = ({ value = [], onChange, help, instances = [], currentValues = {}, setOuterField }) => {
  const stageInstances = useMemo(
    () => (instances || []).filter(inst => inst.type === 'stage_view'),
    [instances]
  );

  const stageOptions = useMemo(() => stageInstances.map(inst => {
    const v = inst.values || {};
    const fqn = v.schema_name && v.schema_name.trim() !== '' ? `${v.schema_name}.${v.view_name}` : v.view_name;
    return { id: inst.id, label: inst.name || v.view_name, fqn, values: v };
  }), [stageInstances]);

  const getStageByFqn = (fqn) => stageOptions.find(opt => opt.fqn === fqn);

  const addSource = () => {
    const newItem = {
      table: '',
      hashkey_source_column: '',
      business_key_source_column: '',
      ldts_column: 'ldts',
      rsrc_column: 'rsrc',
      rsrc_static: '',
    };
    const next = [...value, newItem];
    onChange(next);
    // Autofill target hub fields only if this is now the ONLY source and not already filled
    if (next.length === 1 && setOuterField) {
      const hkTarget = currentValues?.hub_hashkey_name;
      const bkTarget = currentValues?.hub_business_key_name;
      if (!hkTarget || hkTarget.trim() === '') {
        // if hashkey source exists after user sets it, we fill on that change instead of now
      }
      if (!bkTarget || bkTarget.trim() === '') {
        // same for business key
      }
    }
  };

  const removeSource = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateSource = (index, field, newValue) => {
    const next = value.map((src, i) => (i === index ? { ...src, [field]: newValue } : src));
    onChange(next);
    // If exactly one source, mirror its selected columns to target fields if empty
    if (next.length === 1 && index === 0 && setOuterField) {
      const only = next[0] || {};
      if (field === 'hashkey_source_column') {
        if (!currentValues?.hub_hashkey_name || currentValues.hub_hashkey_name.trim() === '') {
          setOuterField('hub_hashkey_name', newValue);
        }
      }
      if (field === 'business_key_source_column') {
        if (!currentValues?.hub_business_key_name || currentValues.hub_business_key_name.trim() === '') {
          setOuterField('hub_business_key_name', newValue);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {help && <div className="text-xs text-gray-500">{help}</div>}

      {value.map((src, index) => (
        <div key={index} className="rounded-md border p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">Source {index + 1}</h4>
            <button type="button" className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-500" onClick={() => removeSource(index)} title="Remove source">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source table</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="user_spaces.user_obause.stg_customer"
                  value={src.table || ''}
                  onChange={(e) => updateSource(index, 'table', e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  list={`stage-tables-${index}`}
                />
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={getStageByFqn(src.table)?.id || ''}
                  onChange={(e) => {
                    const sel = stageOptions.find(o => o.id === e.target.value);
                    if (sel) updateSource(index, 'table', sel.fqn);
                  }}
                >
                  <option value="">Select stage…</option>
                  {stageOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.fqn}</option>
                  ))}
                </select>
              </div>
              <datalist id={`stage-tables-${index}`}>
                {stageOptions.map(opt => (
                  <option key={opt.fqn} value={opt.fqn}>{opt.label}</option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Column mappings</label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sel = getStageByFqn(src.table);
                  const stageValues = sel?.values || {};
                  const hashkeyNames = Array.isArray(stageValues.hashkeys) ? stageValues.hashkeys.map(h => h?.name).filter(Boolean) : [];
                  const businessKeyNames = Array.isArray(stageValues.hashkeys) ? stageValues.hashkeys.flatMap(h => Array.isArray(h?.business_keys) ? h.business_keys : []).filter(Boolean) : [];
                  return (
                    <>
                      <input
                        type="text"
                        placeholder="hk_customer_h"
                        value={src.hashkey_source_column || ''}
                        onChange={(e) => updateSource(index, 'hashkey_source_column', e.target.value)}
                        className="w-full md:w-auto flex-1 rounded-md border px-3 py-2 text-sm"
                        list={`stage-hk-${index}`}
                      />
                      <datalist id={`stage-hk-${index}`}>
                        {hashkeyNames.map(name => (<option key={name} value={name} />))}
                      </datalist>
                      <input
                        type="text"
                        placeholder="c_custkey"
                        value={src.business_key_source_column || ''}
                        onChange={(e) => updateSource(index, 'business_key_source_column', e.target.value)}
                        className="w-full md:w-auto flex-1 rounded-md border px-3 py-2 text-sm"
                        list={`stage-bk-${index}`}
                      />
                      <datalist id={`stage-bk-${index}`}>
                        {businessKeyNames.map(name => (<option key={name} value={name} />))}
                      </datalist>
                      <input
                        type="text"
                        placeholder="TPC_H_SF1.Customer (static)"
                        value={src.rsrc_static || ''}
                        onChange={(e) => updateSource(index, 'rsrc_static', e.target.value)}
                        className="w-full md:w-auto rounded-md border px-3 py-2 text-sm"
                      />
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <input
                  type="text"
                  placeholder="ldts"
                  value={src.ldts_column || 'ldts'}
                  onChange={(e) => updateSource(index, 'ldts_column', e.target.value)}
                  className="w-full md:w-auto rounded-md border px-3 py-2 text-sm"
                  list={`stage-ldts-${index}`}
                />
                <datalist id={`stage-ldts-${index}`}>
                  <option value="ldts" />
                </datalist>
                <input
                  type="text"
                  placeholder="rsrc"
                  value={src.rsrc_column || 'rsrc'}
                  onChange={(e) => updateSource(index, 'rsrc_column', e.target.value)}
                  className="w-full md:w-auto rounded-md border px-3 py-2 text-sm"
                  list={`stage-rsrc-${index}`}
                />
                <datalist id={`stage-rsrc-${index}`}>
                  <option value="rsrc" />
                </datalist>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500" onClick={addSource}>
        <Plus size={16} /> Add Source
      </button>
    </div>
  );
};

export default HubSourcesConfigField; 