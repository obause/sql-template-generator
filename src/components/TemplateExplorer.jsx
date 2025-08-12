import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const entityOptions = [
  { key: 'hub', label: 'Hubs' },
  { key: 'link', label: 'Links' },
  { key: 'satellite', label: 'Satellites' },
  { key: 'multi_active_satellite', label: 'Multi-Active Satellites' },
  { key: 'pit', label: 'PITs' },
  { key: 'snapshot', label: 'Snapshot Tables' },
  { key: 'stage_view', label: 'Stage Views' },
  { key: 'settings', label: 'Settings' },
];

export default function TemplateExplorer({ instances, onCreate, onSelect, onDelete, selectedId }) {
  const grouped = entityOptions.reduce((acc, ent) => {
    acc[ent.key] = instances.filter(i => i.type === ent.key);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Template Explorer</div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500" onClick={() => onCreate()}>
          <Plus size={16} /> New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {entityOptions.map(ent => (
          <div key={ent.key} className="mb-3">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-500">{ent.label}</div>
            <div className="px-2 space-y-1">
              {ent.key !== 'settings' && grouped[ent.key].map(item => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-2 px-2 py-1 rounded-md cursor-pointer ${item.id === selectedId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onSelect(item.id)}
                >
                  <div className="flex-1 truncate text-sm">{
                    (() => {
                      const values = item.values || {};
                      const preferred = ent.key === 'stage_view' ? values.view_name : values.table_name;
                      if (preferred && String(preferred).trim() !== '') return preferred;
                      return item.name || `${ent.label.slice(0,-1)} ${item.shortId}`;
                    })()
                  }</div>
                  <button
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {ent.key !== 'settings' && grouped[ent.key].length === 0 && (
                <div className="px-2 py-1 text-xs text-gray-500">No {ent.label.toLowerCase()} yet</div>
              )}
            </div>
            {ent.key !== 'settings' ? (
              <div className="px-2 pt-1">
                <button className="w-full inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => onCreate(ent.key)}>
                  <Plus size={14} /> Add {ent.label.slice(0,-1)}
                </button>
              </div>
            ) : (
              <div className="px-2 pt-1">
                <button className="w-full inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => onSelect('GLOBAL_SETTINGS')}>Open Settings</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 