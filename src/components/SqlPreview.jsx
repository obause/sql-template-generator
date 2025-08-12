import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check } from 'lucide-react';

const SqlPreview = ({ sql, templateName, onNotify }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql || '');
      setCopied(true);
      onNotify && onNotify({ title: 'Copied SQL to clipboard' });
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      onNotify && onNotify({ title: 'Failed to copy SQL', variant: 'error' });
    }
  };

  const editorOptions = {
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Generated SQL{templateName ? ` – ${templateName}` : ''}</h3>
        <button
          className={`inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-50`}
          onClick={handleCopy}
          disabled={!sql || sql.trim() === ''}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy SQL'}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {sql && sql.trim() ? (
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={sql}
            theme="vs-dark"
            options={editorOptions}
          />
        ) : (
          <div className="h-full grid place-items-center text-gray-500 text-sm px-6 text-center">
            Select a template and fill in the required fields to generate SQL code.
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlPreview;