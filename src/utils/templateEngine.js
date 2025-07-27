// Simple template engine for processing SQL templates
export const processTemplate = async (template, variables) => {
  if (!template || !variables) {
    return template || '';
  }

  let templateContent = template;
  
  // Check if template is a file reference
  if (typeof template === 'string' && template.startsWith('file:')) {
    const filePath = template.substring(5); // Remove 'file:' prefix
    try {
      const response = await fetch(`/templates/${filePath}`);
      if (response.ok) {
        templateContent = await response.text();
      } else {
        console.error(`Failed to load template file: ${filePath}`);
        return `Error: Could not load template file ${filePath}`;
      }
    } catch (error) {
      console.error(`Error loading template file: ${filePath}`, error);
      return `Error: Could not load template file ${filePath}`;
    }
  }

  // Add current date
  const processedVariables = {
    ...variables,
    current_date: new Date().toLocaleDateString()
  };

  let result = templateContent;

  // Process simple variables like {{table_name}}
  Object.keys(processedVariables).forEach(key => {
    const value = processedVariables[key];
    if (Array.isArray(value)) {
      // Handle array variables with Mustache-like syntax
      const singleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const blockRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');
      
      // Replace block syntax {{#array}}...{{/array}}
      result = result.replace(blockRegex, (match, content) => {
        return value.map((item, index) => {
          let processedContent = content
            .replace(/\{\{@index\}\}/g, index)
            .replace(/\{\{@last\}\}/g, index === value.length - 1 ? 'true' : '');
          
          // Handle different types of items
          if (typeof item === 'object' && item !== null) {
            // For hashkey-config objects
            if (item.name !== undefined) {
              processedContent = processedContent
                .replace(/\{\{name\}\}/g, item.name || '')
                .replace(/\{\{single_key\}\}/g, item.single_key ? 'true' : '');
              
              // Handle business_keys array
              if (item.business_keys && Array.isArray(item.business_keys)) {
                const businessKeysBlock = processedContent.match(/\{\{#business_keys\}\}([\s\S]*?)\{\{\/business_keys\}\}/);
                if (businessKeysBlock) {
                  const businessKeysContent = businessKeysBlock[1];
                  const businessKeysResult = item.business_keys
                    .filter(key => key && key.trim() !== '')
                    .map((key, keyIndex) => 
                      businessKeysContent
                        .replace(/\{\{\.\}\}/g, key)
                        .replace(/\{\{@index\}\}/g, keyIndex)
                        .replace(/\{\{@last\}\}/g, keyIndex === item.business_keys.filter(k => k && k.trim() !== '').length - 1 ? 'true' : '')
                    ).join('');
                  processedContent = processedContent.replace(businessKeysBlock[0], businessKeysResult);
                }
              }
            }
            // For hashdiff-config objects
            else if (item.columns !== undefined) {
              processedContent = processedContent
                .replace(/\{\{name\}\}/g, item.name || '');
              
              // Handle columns array
              if (item.columns && Array.isArray(item.columns)) {
                const columnsBlock = processedContent.match(/\{\{#columns\}\}([\s\S]*?)\{\{\/columns\}\}/);
                if (columnsBlock) {
                  const columnsContent = columnsBlock[1];
                  const columnsResult = item.columns
                    .filter(col => col && col.trim() !== '')
                    .map((col, colIndex) => 
                      columnsContent
                        .replace(/\{\{\.\}\}/g, col)
                        .replace(/\{\{@index\}\}/g, colIndex)
                        .replace(/\{\{@last\}\}/g, colIndex === item.columns.filter(c => c && c.trim() !== '').length - 1 ? 'true' : '')
                    ).join('');
                  processedContent = processedContent.replace(columnsBlock[0], columnsResult);
                }
              }
            }
          } else {
            // For simple string items
            processedContent = processedContent.replace(/\{\{\.\}\}/g, item);
          }
          
          return processedContent;
        }).join('');
      });
      
      // Replace simple array syntax {{array}} with comma-separated values
      result = result.replace(singleRegex, value.join(', '));
    } else if (typeof value === 'boolean') {
      // Handle boolean values for conditionals
      const ifBlockRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');
      const elseBlockRegex = new RegExp(`\\{\\{\\^${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');
      
      // Replace conditional blocks
      result = result.replace(ifBlockRegex, value ? '$1' : '');
      result = result.replace(elseBlockRegex, !value ? '$1' : '');
      
      // Replace simple boolean
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value.toString());
    } else {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    }
  });

  // Handle nested object properties like {{item.property}} - only for simple cases
  Object.keys(processedVariables).forEach(key => {
    const value = processedVariables[key];
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      value.forEach((item, index) => {
        Object.keys(item).forEach(prop => {
          // Only handle simple string/number properties, not complex nested arrays
          if (typeof item[prop] === 'string' || typeof item[prop] === 'number') {
            const nestedRegex = new RegExp(`\\{\\{${key}\\.${index}\\.${prop}\\}\\}`, 'g');
            result = result.replace(nestedRegex, item[prop] || '');
          }
        });
      });
    }
  });

  // Clean up any remaining empty placeholders
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result;
};

// Validate required fields
export const validateFields = (fields, values) => {
  const errors = {};
  
  fields.forEach(field => {
    if (field.required) {
      const value = values[field.name];
      if (field.type === 'checkbox') {
        // Checkboxes are not typically required, but if they are, check if true
        if (!value) {
          errors[field.name] = `${field.label} is required`;
        }
      } else if (field.type === 'hashkey-config') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors[field.name] = `${field.label} is required`;
        } else {
          // Check if all hash keys have names and business keys
          const hasEmptyHashKey = value.some(hashKey => 
            !hashKey.name || 
            !hashKey.business_keys || 
            hashKey.business_keys.length === 0 ||
            hashKey.business_keys.every(key => !key || key.trim() === '')
          );
          if (hasEmptyHashKey) {
            errors[field.name] = `All hash keys must have a name and at least one business key`;
          }
        }
      } else if (field.type === 'hashdiff-config') {
        // Hash diffs are optional, but if provided, they should be valid
        if (value && Array.isArray(value)) {
          const hasEmptyHashDiff = value.some(hashDiff => 
            !hashDiff.name || 
            !hashDiff.columns || 
            hashDiff.columns.length === 0 ||
            hashDiff.columns.every(col => !col || col.trim() === '')
          );
          if (hasEmptyHashDiff) {
            errors[field.name] = `All hash diffs must have a name and at least one column`;
          }
        }
      } else if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[field.name] = `${field.label} is required`;
      }
    }
  });
  
  return errors;
};

// Get default values for fields
export const getDefaultValues = (fields) => {
  const defaults = {};
  
  fields.forEach(field => {
    if (field.type === 'multi-text') {
      defaults[field.name] = [''];
    } else if (field.type === 'checkbox') {
      defaults[field.name] = false;
    } else if (field.type === 'hashkey-config') {
      defaults[field.name] = [{ 
        name: '', 
        business_keys: [''], 
        single_key: true 
      }];
    } else if (field.type === 'hashdiff-config') {
      defaults[field.name] = [];
    } else {
      defaults[field.name] = field.placeholder || '';
    }
  });
  
  return defaults;
}; 