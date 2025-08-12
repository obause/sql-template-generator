import React, { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import HashKeyConfigField from './HashKeyConfigField.jsx';
import HashDiffConfigField from './HashDiffConfigField.jsx';
import ColumnConfigField from './ColumnConfigField.jsx';
import HubSourcesConfigField from './HubSourcesConfigField.jsx';
import LinkHubsConfigField from './LinkHubsConfigField.jsx';
import SatellitesConfigField from './SatellitesConfigField.jsx';
import SelectMenu from './SelectMenu.jsx';

const FormField = ({ field, value, onChange, error, instances = [], allValues = {}, currentType }) => {
  // Stage context for suggestions (used by satellite and multi-active satellite)
  const stageInstances = useMemo(() => (instances || []).filter(i => i.type === 'stage_view'), [instances]);
  const stageOptions = useMemo(() => stageInstances.map(inst => {
    const v = inst.values || {};
    const fqn = v.schema_name && v.schema_name.trim() !== '' ? `${v.schema_name}.${v.view_name}` : v.view_name;
    const hashkeys = Array.isArray(v.hashkeys) ? v.hashkeys.map(h => h?.name).filter(Boolean) : [];
    const hashdiffs = Array.isArray(v.hashdiffs) ? v.hashdiffs.map(h => h?.name).filter(Boolean) : [];
    const sourceCols = Array.isArray(v.source_columns) ? v.source_columns.map(c => c?.name).filter(Boolean) : [];
    return { id: inst.id, label: inst.name || v.view_name, fqn, values: v, hashkeys, hashdiffs, sourceCols };
  }), [stageInstances]);
  const selectedStage = useMemo(() => stageOptions.find(o => o.fqn === allValues.source_table) || null, [stageOptions, allValues.source_table]);

  // Hubs and Links for PIT linking
  const hubInstances = useMemo(() => (instances || []).filter(i => i.type === 'hub'), [instances]);
  const linkInstances = useMemo(() => (instances || []).filter(i => i.type === 'link'), [instances]);
  const hubOptions = useMemo(() => hubInstances.map(inst => {
    const v = inst.values || {};
    const fqn = v.schema_name && v.schema_name.trim() !== '' ? `${v.schema_name}.${v.table_name}` : v.table_name;
    return { id: inst.id, label: v.table_name || inst.name, fqn, hashkey: v.hub_hashkey_name };
  }).filter(o => o.fqn), [hubInstances]);
  const linkOptions = useMemo(() => linkInstances.map(inst => {
    const v = inst.values || {};
    const fqn = v.schema_name && v.schema_name.trim() !== '' ? `${v.schema_name}.${v.table_name}` : v.table_name;
    return { id: inst.id, label: v.table_name || inst.name, fqn, hashkey: v.link_hashkey_name };
  }).filter(o => o.fqn), [linkInstances]);
  const allEntityOptions = useMemo(() => ([
    { group: 'Hubs', items: hubOptions },
    { group: 'Links', items: linkOptions }
  ]), [hubOptions, linkOptions]);
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
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
        checked={value || false}
        onChange={handleCheckboxChange}
      />
      {field.help && <span className="text-xs text-slate-400">{field.help}</span>}
    </label>
  );

  const renderSingleInput = () => (
    <input
      type="text"
      className={`w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
      value={value || ''}
      onChange={handleSingleChange}
      placeholder={field.placeholder}
      title={field.help}
    />
  );

  const renderSourceTablePicker = () => {
    const options = stageOptions.map(o => ({ value: o.fqn, label: o.fqn }));
    return (
      <div className="flex gap-2">
        <input
          type="text"
          className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-500' : ''}`}
          value={value || ''}
          onChange={handleSingleChange}
          placeholder={field.placeholder}
          title={field.help}
        />
        <SelectMenu
          options={options}
          value={(selectedStage && selectedStage.fqn === value) ? selectedStage.fqn : ''}
          onChange={(val) => onChange(field.name, val)}
          buttonClassName="w-56"
        />
      </div>
    );
  };

  const renderSingleWithSuggestions = (suggestions = []) => {
    const options = suggestions.map(s => ({ value: s, label: s }));
    return (
      <div className="flex gap-2">
        <input
          type="text"
          className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-500' : ''}`}
          value={value || ''}
          onChange={handleSingleChange}
          placeholder={field.placeholder}
          title={field.help}
        />
        <SelectMenu
          options={options}
          value={''}
          onChange={(val) => onChange(field.name, val)}
          buttonClassName="w-56"
        />
      </div>
    );
  };

  const renderTrackedEntityPicker = () => (
    <div className="flex gap-2">
      <select
        className="rounded-md border px-3 py-2 text-sm"
        value=""
        onChange={(e) => {
          const [type, id] = e.target.value.split('::');
          const opt = type === 'hub' ? hubOptions.find(o => o.id === id) : linkOptions.find(o => o.id === id);
          if (opt) {
            onChange('tracked_entity', opt.fqn);
            if (opt.hashkey) {
              onChange('tracked_entity_hashkey', opt.hashkey);
            }
          }
        }}
      >
        <option value="">Select Hub/Link…</option>
        {hubOptions.length > 0 && (
          <optgroup label="Hubs">
            {hubOptions.map(o => (
              <option key={o.id} value={`hub::${o.id}`}>{o.label}</option>
            ))}
          </optgroup>
        )}
        {linkOptions.length > 0 && (
          <optgroup label="Links">
            {linkOptions.map(o => (
              <option key={o.id} value={`link::${o.id}`}>{o.label}</option>
            ))}
          </optgroup>
        )}
      </select>
      <input
        type="text"
        className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-500' : ''}`}
        value={value || ''}
        onChange={handleSingleChange}
        placeholder={field.placeholder}
        title={field.help}
        list={`${field.name}-datalist`}
      />
      <datalist id={`${field.name}-datalist`}>
        {allEntityOptions.flatMap(g => g.items).map(o => (
          <option key={o.fqn} value={o.fqn}>{o.label}</option>
        ))}
      </datalist>
    </div>
  );

  const renderMultiInput = () => {
    const arrayValue = Array.isArray(value) ? value : [''];
    
    return (
      <div>
        {arrayValue.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {(() => {
              const suggestions = field.name === 'descriptive_columns' ? (selectedStage?.sourceCols || []) : [];
              return (
                <>
                  <input
                    type="text"
                    className={`w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                    value={item || ''}
                    onChange={(e) => handleMultiChange(index, e.target.value)}
                    placeholder={field.placeholder}
                    title={field.help}
                    list={`${field.name}-datalist`}
                  />
                  {suggestions.length > 0 && (
                    <datalist id={`${field.name}-datalist`}>
                      {suggestions.map(name => (<option key={name} value={name} />))}
                    </datalist>
                  )}
                </>
              );
            })()}
            {arrayValue.length > 1 && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-2 text-xs hover:bg-red-500"
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
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500"
          onClick={addMultiField}
          title="Add another field"
        >
          <Plus size={16} />
          Add {field.label}
        </button>
      </div>
    );
  };

  const renderHashKeyConfig = () => {
    const sourceColumnOptions = Array.isArray(allValues?.source_columns)
      ? allValues.source_columns.map(c => c?.name).filter(Boolean)
      : [];
    return (
      <HashKeyConfigField
        value={value}
        onChange={handleComplexChange}
        error={error}
        sourceColumnOptions={sourceColumnOptions}
      />
    );
  };

  const renderHashDiffConfig = () => {
    const sourceColumnOptions = Array.isArray(allValues?.source_columns)
      ? allValues.source_columns.map(c => c?.name).filter(Boolean)
      : [];
    return (
      <HashDiffConfigField
        value={value}
        onChange={handleComplexChange}
        error={error}
        sourceColumnOptions={sourceColumnOptions}
      />
    );
  };

  const renderHubSourcesConfig = () => (
    <HubSourcesConfigField
      value={value}
      onChange={handleComplexChange}
      help={field.help}
      instances={instances}
      currentValues={allValues}
      setOuterField={onChange}
    />
  );

  const renderLinkHubsConfig = () => (
    <LinkHubsConfigField
      value={value}
      onChange={handleComplexChange}
      help={field.help}
      instances={instances}
      allValues={allValues}
    />
  );

  const renderColumnConfig = () => (
    <ColumnConfigField
      value={value}
      onChange={handleComplexChange}
      placeholder={field.placeholder}
      help={field.help}
    />
  );

  const renderSatellitesConfig = () => (
    <SatellitesConfigField
      value={value}
      onChange={handleComplexChange}
      help={field.help}
      instances={instances}
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
      case 'hub-sources-config':
        return renderHubSourcesConfig();
      case 'link-hubs-config':
        return renderLinkHubsConfig();
      case 'satellites-config':
        return renderSatellitesConfig();
      case 'column-config':
        return renderColumnConfig();
      default: {
        // Special-case suggestions for satellite/MAS fields
        if (field.name === 'source_table') {
          // In stage_view, the source_table must be a physical table, not an existing template
          if (currentType === 'stage_view') return renderSingleInput();
          return renderSourceTablePicker();
        }
        if (field.name === 'parent_hashkey_name') return renderSingleWithSuggestions(selectedStage?.hashkeys || []);
        if (field.name === 'link_hashkey_source_column') return renderSingleWithSuggestions(selectedStage?.hashkeys || []);
        if (field.name === 'hashdiff_name') return renderSingleWithSuggestions(selectedStage?.hashdiffs || []);
        if (field.name === 'multi_active_key_name') return renderSingleWithSuggestions(selectedStage?.hashdiffs || []);
        if (field.name === 'ldts_column') return renderSingleWithSuggestions(['ldts']);
        if (field.name === 'rsrc_column') return renderSingleWithSuggestions(['rsrc']);
        if (field.name === 'tracked_entity') return renderTrackedEntityPicker();
        if (field.name === 'tracked_entity_hashkey') return renderSingleWithSuggestions(allEntityOptions.flatMap(g => g.items.map(i => i.hashkey)).filter(Boolean));
        if (field.name === 'snapshot_table') return renderSingleWithSuggestions(['user_spaces.user_obause.snap_v1', 'user_spaces.user_obause.snap_v0']);
        if (field.name === 'satellites') return renderSingleWithSuggestions((instances||[]).filter(i => i.type==='satellite' || i.type==='multi_active_satellite').map(i => (i.values?.table_name)).filter(Boolean));
        return renderSingleInput();
      }
    }
  };

  return (
    <div className="space-y-1">
      {field.type !== 'checkbox' && (
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderField()}
      {error && (
        <div className="text-red-400 text-xs mt-1">{error}</div>
      )}
      {field.help && !error && field.type !== 'checkbox' && (
        <div className="text-slate-400 text-xs mt-1">{field.help}</div>
      )}
    </div>
  );
};

export default FormField; 