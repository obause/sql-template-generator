import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check } from 'lucide-react';

const SqlPreview = ({ sql, templateName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalSliderSize: 8,
      horizontalSliderSize: 8
    }
  };

  return (
    <div className="sql-preview">
      <div className="sql-header">
        <h3 className="sql-title">
          Generated SQL {templateName && `- ${templateName}`}
        </h3>
        <button
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={!sql || sql.trim() === ''}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
      </div>
      
      <div className="sql-editor">
        {sql && sql.trim() ? (
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={sql}
            theme="vs-dark"
            options={editorOptions}
          />
        ) : (
          <div className="placeholder-text">
            Select a template and fill in the required fields to generate SQL code.
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlPreview; 