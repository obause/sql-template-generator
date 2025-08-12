// Simple template engine for processing SQL templates
export const processTemplate = async (template, variables) => {
  if (!template || !variables) {
    return template || '';
  }

  // Debug logging
  console.log('Template variables:', variables);
  if (variables.hashdiffs) {
    console.log('Hashdiffs data:', JSON.stringify(variables.hashdiffs, null, 2));
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
        console.log(`Processing array block for key: ${key}, array length: ${value.length}`);
        return value.map((item, index) => {
          console.log(`Processing item ${index}:`, item);
          let processedContent = content
            .replace(/\{\{@index\}\}/g, index)
            .replace(/\{\{@last\}\}/g, index === value.length - 1 ? 'true' : '');
          const isArrayItemLast = index === value.length - 1;
          // Generic @last blocks for any array item
          processedContent = processedContent.replace(/\{\{#@last\}\}([\s\S]*?)\{\{\/@last\}\}/g, isArrayItemLast ? '$1' : '');
          processedContent = processedContent.replace(/\{\{\^@last\}\}([\s\S]*?)\{\{\/@last\}\}/g, !isArrayItemLast ? '$1' : '');
          
          // Handle different types of items
          if (typeof item === 'object' && item !== null) {
            console.log(`Item ${index} is an object with keys:`, Object.keys(item));
            // For column-config objects (check this first)
            if (item.name !== undefined && item.datatype !== undefined) {
              console.log('Processing column-config item:', item);
              processedContent = processedContent
                .replace(/\{\{name\}\}/g, item.name || '');
              
              // Handle @is_numeric conditional blocks
              const isNumeric = item.datatype === 'numeric';
              processedContent = processedContent.replace(/\{\{@is_numeric\}\}/g, isNumeric ? 'true' : '');
              processedContent = processedContent.replace(/\{\{#@is_numeric\}\}([\s\S]*?)\{\{\/@is_numeric\}\}/g, isNumeric ? '$1' : '');
              processedContent = processedContent.replace(/\{\{\^@is_numeric\}\}([\s\S]*?)\{\{\/@is_numeric\}\}/g, !isNumeric ? '$1' : '');

              // Handle @is_timestamp conditional blocks
              const isTimestamp = item.datatype === 'timestamp';
              processedContent = processedContent.replace(/\{\{@is_timestamp\}\}/g, isTimestamp ? 'true' : '');
              processedContent = processedContent.replace(/\{\{#@is_timestamp\}\}([\s\S]*?)\{\{\/@is_timestamp\}\}/g, isTimestamp ? '$1' : '');
              processedContent = processedContent.replace(/\{\{\^@is_timestamp\}\}([\s\S]*?)\{\{\/@is_timestamp\}\}/g, !isTimestamp ? '$1' : '');
            }
            // For hashdiff-config objects (check this second since they also have name)
            else if (item.columns !== undefined && Array.isArray(item.columns)) {
              console.log('Processing hashdiff item:', item);
              processedContent = processedContent
                .replace(/\{\{name\}\}/g, item.name || '');
              
              // Build CONCAT parts for columns and NULLIF pattern placeholders
              const filteredColumns = item.columns.filter(col => col && col.trim() !== '');
              const concatParts = filteredColumns.map(col => `IFNULL((CONCAT('"', REPLACE(REPLACE(REPLACE(TRIM(CAST(${col} AS STRING)), '\\\\', '\\\\\\\\'), '"', '\\\"'), '^^', '--'), '"')), '^^')`);
              const columnsConcat = concatParts.join(", '||',\n            ");
              const columnsNullif = filteredColumns.length <= 1 ? "'^^'" : "'^^||^^'";
              processedContent = processedContent
                .replace(/\{\{columns_concat\}\}/g, columnsConcat)
                .replace(/\{\{columns_nullif\}\}/g, columnsNullif);
            }
            // For hashkey-config objects  
            else if (item.business_keys !== undefined && Array.isArray(item.business_keys)) {
              processedContent = processedContent
                .replace(/\{\{name\}\}/g, item.name || '')
                .replace(/\{\{single_key\}\}/g, item.single_key ? 'true' : '');
              
              // Build CONCAT parts for business keys and NULLIF pattern placeholders
              const filteredBusinessKeys = item.business_keys.filter(key => key && key.trim() !== '');
              const bkConcatParts = filteredBusinessKeys.map(key => `IFNULL((CONCAT('"', REPLACE(REPLACE(REPLACE(TRIM(CAST(${key} AS STRING)), '\\\\', '\\\\\\\\'), '"', '\\\"'), '^^', '--'), '"')), '^^')`);
              const businessKeysConcat = bkConcatParts.join(", '||',\n            ");
              const businessKeysNullif = filteredBusinessKeys.length <= 1 ? "'^^'" : "'^^||^^'";
              processedContent = processedContent
                .replace(/\{\{business_keys_concat\}\}/g, businessKeysConcat)
                .replace(/\{\{business_keys_nullif\}\}/g, businessKeysNullif);
              
              // Remove any legacy #business_keys blocks if present
              processedContent = processedContent.replace(/\{\{#business_keys\}\}[\s\S]*?\{\{\/business_keys\}\}/g, '');
            }
            // For generic objects, try to replace any direct property references
            else if (typeof item === 'object') {
              Object.keys(item).forEach(prop => {
                if (typeof item[prop] === 'string') {
                  const propRegex = new RegExp(`\\{\\{${prop}\\}\\}`, 'g');
                  processedContent = processedContent.replace(propRegex, item[prop] || '');
                }
              });
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
      } else if (field.type === 'column-config') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors[field.name] = `${field.label} is required`;
        } else {
          // Check if all columns have names
          const hasEmptyColumn = value.some(column => 
            !column.name || column.name.trim() === ''
          );
          if (hasEmptyColumn) {
            errors[field.name] = `All columns must have a name`;
          }
        }
      } else if (field.type === 'hub-sources-config') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors[field.name] = `${field.label} is required`;
        } else {
                      const hasInvalidSource = value.some(src =>
            !src || typeof src !== 'object' ||
            !src.table || src.table.trim() === '' ||
            !src.hashkey_source_column || src.hashkey_source_column.trim() === '' ||
            !src.business_key_source_column || src.business_key_source_column.trim() === '' ||
            !src.rsrc_static || src.rsrc_static.trim() === ''
          );
          if (hasInvalidSource) {
            errors[field.name] = `Each source must have table, hashkey source column and business key source column`;
          }
        }
      } else if (field.type === 'satellites-config') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors[field.name] = `${field.label} is required`;
        } else {
          const hasInvalid = value.some(item => !item || typeof item !== 'object' || !item.table || item.table.trim() === '' || !item.alias || item.alias.trim() === '');
          if (hasInvalid) {
            errors[field.name] = `Each satellite must have table and alias`;
          }
        }
      } else if (field.type === 'link-hubs-config') {
        if (!value || !Array.isArray(value) || value.length < 2) {
          errors[field.name] = `At least two related hubs are required`;
        } else {
          const hasInvalidHub = value.some(hub =>
            !hub || typeof hub !== 'object' ||
            !hub.hub_hashkey_name || hub.hub_hashkey_name.trim() === '' ||
            !hub.hub_source_column || hub.hub_source_column.trim() === ''
          );
          if (hasInvalidHub) {
            errors[field.name] = `Each related hub must have a target hashkey name and a source column`;
          }
        }
      } else if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[field.name] = `${field.label} is required`;
      }
    }
  });
  
  // Conditional requirement: if not auto-including all source columns, ensure source_columns are provided and valid
  if (Object.prototype.hasOwnProperty.call(values, 'auto_include_all_source_columns') && !values.auto_include_all_source_columns) {
    const sourceColumns = values.source_columns;
    if (!errors.source_columns) {
      if (!sourceColumns || !Array.isArray(sourceColumns) || sourceColumns.length === 0) {
        errors.source_columns = `Source Columns is required`;
      } else {
        const hasEmptyColumn = sourceColumns.some(column => !column || !column.name || column.name.trim() === '');
        if (hasEmptyColumn) {
          errors.source_columns = `All columns must have a name`;
        }
      }
    }
  }
  
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
    } else if (field.type === 'column-config') {
      defaults[field.name] = [{ name: '', datatype: 'string' }];
    } else if (field.type === 'link-hubs-config') {
      defaults[field.name] = [
        { hub_hashkey_name: '', hub_source_column: '' },
        { hub_hashkey_name: '', hub_source_column: '' }
      ];
    } else if (field.type === 'satellites-config') {
      defaults[field.name] = [ { table: '', alias: '' } ];
          } else if (field.type === 'hub-sources-config') {
      defaults[field.name] = [{ table: '', hashkey_source_column: '', business_key_source_column: '', ldts_column: 'ldts', rsrc_column: 'rsrc', rsrc_static: '' }];
    } else {
      defaults[field.name] = field.placeholder || '';
    }
  });
  
  return defaults;
}; 