import React, { useState, useEffect, useMemo } from 'react';
import templatesData from './templates.json';
import FormField from './components/FormField.jsx';
import SqlPreview from './components/SqlPreview.jsx';
import TemplateExplorer from './components/TemplateExplorer.jsx';
import { processTemplate, validateFields, getDefaultValues } from './utils/templateEngine.js';
import { loadInstances, saveInstances, loadLastSelection, saveLastSelection, loadGlobalSettings, saveGlobalSettings } from './utils/storage.js';

function newId() {
  return Math.random().toString(36).slice(2, 8);
}

function toSnakeCase(input) {
  if (!input) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function App() {
  const [instances, setInstances] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [generatedSql, setGeneratedSql] = useState('');
  const [loadMode, setLoadMode] = useState('initial');
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ ldts_default: 'ldts', rsrc_default: 'rsrc' });

  const notify = (toast) => {
    const id = Math.random().toString(36).slice(2,8);
    const entry = { id, title: toast.title || 'Notification', variant: toast.variant || 'default' };
    setToasts(prev => [...prev, entry]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
  };

  // Load persisted instances
  useEffect(() => {
    const loaded = loadInstances();
    setInstances(loaded);
    const last = loadLastSelection();
    if (last) setSelectedId(last);
    setGlobalSettings(loadGlobalSettings());
    setHydrated(true);
  }, []);

  // Persist instances and selection
  useEffect(() => { if (hydrated) saveInstances(instances); }, [instances, hydrated]);
  useEffect(() => { if (hydrated) saveLastSelection(selectedId); }, [selectedId, hydrated]);
  useEffect(() => { if (hydrated) saveGlobalSettings(globalSettings); }, [globalSettings, hydrated]);

  const selectedInstance = useMemo(
    () => instances.find(i => i.id === selectedId) || null,
    [instances, selectedId]
  );

  const currentTemplate = selectedInstance ? templatesData[selectedInstance.type] : null;
  const isSettings = selectedId === 'GLOBAL_SETTINGS';

  // Initialize form values when instance or template changes
  useEffect(() => {
    if (!selectedInstance || !currentTemplate) {
      setFormValues({});
      setGeneratedSql('');
      setErrors({});
      return;
    }
    // Ensure instance has values
    const defaults = getDefaultValues(currentTemplate.fields);
    const merged = { ...defaults, ...(selectedInstance.values || {}) };
    setFormValues(merged);
    setErrors({});
  }, [selectedInstance?.id, currentTemplate]);

  // Generate SQL when form values change
  useEffect(() => {
    if (!selectedInstance || !currentTemplate) return;
    if (Object.keys(formValues).length === 0) return;

    const fieldErrors = validateFields(currentTemplate.fields, formValues);
    setErrors(fieldErrors);

    if (!isSettings && Object.keys(fieldErrors).length !== 0) {
      setGeneratedSql('');
      return;
    }

    // Clean array fields
    const cleanedValues = {};
    currentTemplate.fields.forEach(field => {
      const value = formValues[field.name];
      if (Array.isArray(value)) {
        if (field.type === 'column-config') {
          cleanedValues[field.name] = value
            .filter(item => item && typeof item === 'object' && item.name && item.name.trim() !== '')
            .map(item => ({
              ...item,
              '@is_timestamp': item.datatype === 'timestamp',
              '@is_numeric': item.datatype === 'numeric',
            }));
        } else if (
          field.type === 'hashkey-config' ||
          field.type === 'hashdiff-config' ||
          field.type === 'hub-sources-config' ||
          field.type === 'link-hubs-config' ||
          field.type === 'satellites-config'
        ) {
          cleanedValues[field.name] = value.filter(item => {
            if (!item || typeof item !== 'object') return false;
            if (field.type === 'link-hubs-config') {
              const hasTarget = item.hub_hashkey_name && typeof item.hub_hashkey_name === 'string' && item.hub_hashkey_name.trim() !== '';
              const hasSource = item.hub_source_column && typeof item.hub_source_column === 'string' && item.hub_source_column.trim() !== '';
              return hasTarget && hasSource;
            } else if (field.type === 'satellites-config') {
              const hasTable = item.table && typeof item.table === 'string' && item.table.trim() !== '';
              const hasAlias = item.alias && typeof item.alias === 'string' && item.alias.trim() !== '';
              return hasTable && hasAlias;
            }
            return Object.values(item).some(val => Array.isArray(val) ? val.some(v => v && v.trim && v.trim() !== '') : (val && (typeof val !== 'string' || val.trim() !== '')));
          });
        } else {
          cleanedValues[field.name] = value.filter(item => item && typeof item === 'string' && item.trim() !== '');
        }
      } else {
        cleanedValues[field.name] = value;
      }
    });

    // Apply global defaults for ldts/rsrc when available and fields empty
    if (cleanedValues.ldts_column === '' || cleanedValues.ldts_column === undefined) {
      cleanedValues.ldts_column = globalSettings.ldts_default;
    }
    if (cleanedValues.rsrc_column === '' || cleanedValues.rsrc_column === undefined) {
      cleanedValues.rsrc_column = globalSettings.rsrc_default;
    }

    const templatePath = (selectedInstance.type !== 'stage_view' && loadMode === 'incremental' && currentTemplate.incrementalTemplate)
      ? currentTemplate.incrementalTemplate
      : currentTemplate.template;

    processTemplate(templatePath, cleanedValues)
      .then(setGeneratedSql)
      .catch(() => setGeneratedSql('Error processing template'));
  }, [formValues, currentTemplate, selectedInstance?.id, loadMode]);

  const updateInstanceValues = (updater) => {
    setInstances(prev => prev.map(inst => inst.id === selectedId ? { ...inst, values: updater(inst.values || {}) } : inst));
  };

  const handleFieldChange = (fieldName, value) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
    updateInstanceValues(values => ({ ...values, [fieldName]: value }));

    // Auto-fill dependent fields when instance_name changes
    if (fieldName === 'instance_name') {
      const base = toSnakeCase(value);
      if (!base || !selectedInstance) return;

      const updates = {};
      if (selectedInstance.type === 'hub') {
        if (!formValues.table_name) updates.table_name = `${base}_h`;
        if (!formValues.hub_hashkey_name) updates.hub_hashkey_name = `hk_${base}_h`;
      } else if (selectedInstance.type === 'link') {
        if (!formValues.table_name) updates.table_name = `${base}_l`;
        if (!formValues.link_hashkey_name) updates.link_hashkey_name = `hk_${base}_l`;
      } else if (selectedInstance.type === 'satellite') {
        if (!formValues.table_name) updates.table_name = `${base}_s`;
        if (!formValues.parent_hashkey_name) updates.parent_hashkey_name = `hk_${base}_h`;
        if (!formValues.hashdiff_name) updates.hashdiff_name = `hd_${base}_s`;
      }

      if (Object.keys(updates).length > 0) {
        setFormValues(prev => ({ ...prev, ...updates }));
        updateInstanceValues(values => ({ ...values, ...updates }));
      }
    }

    // For Link: when selecting link_hashkey_source_column first time, set target link_hashkey_name if empty
    if (selectedInstance?.type === 'link' && fieldName === 'link_hashkey_source_column') {
      if (!formValues.link_hashkey_name || String(formValues.link_hashkey_name).trim() === '') {
        setFormValues(prev => ({ ...prev, link_hashkey_name: value }));
        updateInstanceValues(values => ({ ...values, link_hashkey_name: value }));
      }
    }
  };

  const createInstance = (type = 'hub') => {
    const id = newId();
    const shortId = id.slice(0, 4);
    const name = `${templatesData[type]?.name || 'Template'} ${shortId}`;
    const inst = { id, shortId, name, type, values: {} };
    setInstances(prev => [inst, ...prev]);
    setSelectedId(id);
  };

  const deleteInstance = (id) => {
    setInstances(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) {
      setSelectedId(prev => (instances.find(i => i.id !== id)?.id || null));
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b">
        <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SQL Template Generator</h1>
            <p className="text-sm text-gray-500">Generate Data Vault 2.0 SQL with configurable, reusable templates</p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-600">
            <div className="inline-flex items-center gap-2">
              <span>Mode</span>
              <div className="flex rounded-md overflow-hidden border">
                <button
                  className={`px-3 py-1 ${loadMode==='initial' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                  onClick={() => setLoadMode('initial')}
                  disabled={selectedInstance?.type === 'stage_view'}
                >Initial</button>
                <button
                  className={`px-3 py-1 ${loadMode==='incremental' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                  onClick={() => setLoadMode('incremental')}
                  disabled={selectedInstance?.type === 'stage_view'}
                >Incremental</button>
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <span>Theme</span>
              <button className="px-3 py-1 rounded-md border hover:bg-gray-100">Toggle</button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full grid grid-cols-12 gap-0">
        <aside className="col-span-12 md:col-span-2 xl:col-span-2 border-r">
          <TemplateExplorer
            instances={instances}
            onCreate={createInstance}
            onSelect={setSelectedId}
            onDelete={deleteInstance}
            selectedId={selectedId}
          />
        </aside>

        <section className="col-span-12 md:col-span-4 xl:col-span-4 border-r p-6 overflow-y-auto min-h-[calc(100vh-72px)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{isSettings ? 'Global Settings' : 'Configuration'}</h3>
            {!isSettings && currentTemplate && <span className="text-xs text-gray-500">{currentTemplate.name}</span>}
          </div>
          {isSettings ? (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Default LDTS Column</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={globalSettings.ldts_default}
                  onChange={(e) => setGlobalSettings(s => ({ ...s, ldts_default: e.target.value }))}
                  placeholder="ldts"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Default RSRC Column</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={globalSettings.rsrc_default}
                  onChange={(e) => setGlobalSettings(s => ({ ...s, rsrc_default: e.target.value }))}
                  placeholder="rsrc"
                />
              </div>
            </form>
          ) : currentTemplate ? (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {currentTemplate.fields.map(field => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formValues[field.name]}
                  onChange={handleFieldChange}
                  error={errors[field.name]}
                  instances={instances}
                  allValues={formValues}
                  currentType={selectedInstance?.type}
                />
              ))}
            </form>
          ) : (<div className="rounded-md border p-4 text-gray-500">Create or select a template instance from the left.</div>)}
        </section>

        <section className="col-span-12 md:col-span-6 xl:col-span-6 sticky top-16 h-[calc(100vh-64px)] overflow-hidden p-0">
          <SqlPreview
            sql={generatedSql}
            templateName={currentTemplate?.name}
            onNotify={notify}
          />
        </section>
      </main>
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`rounded-md border px-3 py-2 text-sm shadow bg-white ${t.variant==='error' ? 'border-red-300' : 'border-gray-200'}`}>
            {t.title}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App; 