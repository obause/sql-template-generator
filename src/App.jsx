import React, { useState, useEffect } from 'react';
import templatesData from './templates.json';
import FormField from './components/FormField.jsx';
import SqlPreview from './components/SqlPreview.jsx';
import { processTemplate, validateFields, getDefaultValues } from './utils/templateEngine.js';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [generatedSql, setGeneratedSql] = useState('');

  const templates = Object.keys(templatesData);
  const currentTemplate = selectedTemplate ? templatesData[selectedTemplate] : null;

  // Initialize form values when template changes
  useEffect(() => {
    if (currentTemplate) {
      const defaults = getDefaultValues(currentTemplate.fields);
      setFormValues(defaults);
      setErrors({});
    } else {
      setFormValues({});
      setGeneratedSql('');
    }
  }, [selectedTemplate, currentTemplate]);

  // Generate SQL when form values change
  useEffect(() => {
    if (currentTemplate && Object.keys(formValues).length > 0) {
      // Validate fields
      const fieldErrors = validateFields(currentTemplate.fields, formValues);
      setErrors(fieldErrors);

      // Generate SQL if no errors
      if (Object.keys(fieldErrors).length === 0) {
        // Filter out empty values from arrays
        const cleanedValues = {};
        Object.keys(formValues).forEach(key => {
          const value = formValues[key];
          if (Array.isArray(value)) {
            // Handle different array types based on field type
            const field = currentTemplate.fields.find(f => f.name === key);
            if (field && (field.type === 'hashkey-config' || field.type === 'hashdiff-config')) {
              // For complex config fields, filter out empty objects
              cleanedValues[key] = value.filter(item => 
                item && 
                typeof item === 'object' && 
                Object.values(item).some(val => 
                  Array.isArray(val) ? val.some(v => v && v.trim() !== '') : (val && val.trim() !== '')
                )
              );
            } else {
              // For simple text arrays, filter out empty strings
              cleanedValues[key] = value.filter(item => item && typeof item === 'string' && item.trim() !== '');
            }
          } else {
            cleanedValues[key] = value;
          }
        });

        processTemplate(currentTemplate.template, cleanedValues).then(sql => {
          setGeneratedSql(sql);
        }).catch(error => {
          console.error('Error processing template:', error);
          setGeneratedSql('Error processing template');
        });
      } else {
        setGeneratedSql('');
      }
    }
  }, [formValues, currentTemplate]);

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };

  const handleFieldChange = (fieldName, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>SQL Template Generator</h1>
        <p>Generate Data Vault 2.0 SQL code using customizable templates</p>
      </header>

      <main className="main-content">
        <div className="left-panel">
          {/* Template Selection */}
          <div className="section">
            <h3>Template Selection</h3>
            <div className="template-selector">
              <select
                className="template-select"
                value={selectedTemplate}
                onChange={handleTemplateChange}
              >
                <option value="">Select a template...</option>
                {templates.map(templateKey => (
                  <option key={templateKey} value={templateKey}>
                    {templatesData[templateKey].name}
                  </option>
                ))}
              </select>
              
              {currentTemplate && (
                <div className="template-description fade-in">
                  {currentTemplate.description}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Form Fields */}
          {currentTemplate && (
            <div className="section">
              <h3>Configuration</h3>
              <form onSubmit={(e) => e.preventDefault()}>
                {currentTemplate.fields.map(field => (
                  <FormField
                    key={field.name}
                    field={field}
                    value={formValues[field.name]}
                    onChange={handleFieldChange}
                    error={errors[field.name]}
                  />
                ))}
              </form>
            </div>
          )}
        </div>

        <div className="right-panel">
          <SqlPreview 
            sql={generatedSql} 
            templateName={currentTemplate?.name}
          />
        </div>
      </main>
    </div>
  );
}

export default App; 