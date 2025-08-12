import React, { useState, useRef, useEffect } from 'react';

export default function SelectMenu({ options = [], value = '', placeholder = 'Select…', onChange, buttonClassName = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  return (
    <div className={`relative ${buttonClassName}`} ref={ref}>
      <button type="button" className="inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(v => !v)}>
        <span className="truncate text-left">{selectedLabel || placeholder}</span>
        <svg className="h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-56 rounded-md border bg-white shadow">
          <div className="max-h-56 overflow-auto py-1">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${opt.value === value ? 'bg-gray-50 font-medium' : ''}`}
                onClick={() => { onChange && onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


