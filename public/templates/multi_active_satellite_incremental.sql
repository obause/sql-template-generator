WITH


source_data AS (

    SELECT
        {{parent_hashkey_name}},
        {{multi_active_key_name}} as {{multi_active_key_name}},
        
        {{rsrc_column}},
        {{ldts_column}},
{{#descriptive_columns}}
        {{.}}{{^@last}},{{/@last}}
{{/descriptive_columns}}
    FROM {{source_table}}
    WHERE {{ldts_column}} > (
        SELECT
            MAX({{ldts_column}}) FROM {{table_name}}
        WHERE {{ldts_column}} != TO_TIMESTAMP('8888-12-31T23:59:59', 'YYYY-MM-DDTHH24:MI:SS')
    )

),


latest_entries_in_sat AS (

    SELECT
        {{parent_hashkey_name}},
        {{multi_active_key_name}}
    FROM 
        {{table_name}}
    QUALIFY ROW_NUMBER() OVER(PARTITION BY {{parent_hashkey_name}} ORDER BY {{ldts_column}} DESC) = 1  
),


deduped_row_hashdiff AS (

  SELECT 
    {{parent_hashkey_name}},
    {{ldts_column}},
    {{multi_active_key_name}}
  FROM source_data
  QUALIFY CASE
            WHEN {{multi_active_key_name}} = LAG({{multi_active_key_name}}) OVER (PARTITION BY {{parent_hashkey_name}} ORDER BY {{ldts_column}}) THEN FALSE
            ELSE TRUE
          END
),


deduped_rows AS (

  SELECT 
    source_data.{{parent_hashkey_name}},
    source_data.{{multi_active_key_name}},
    source_data.{{rsrc_column}}
        , source_data.{{ldts_column}}
{{#descriptive_columns}}
        , source_data.{{.}}
{{/descriptive_columns}}
  FROM source_data
  INNER JOIN deduped_row_hashdiff
    ON source_data.{{parent_hashkey_name}} = deduped_row_hashdiff.{{parent_hashkey_name}}
    AND source_data.{{ldts_column}} = deduped_row_hashdiff.{{ldts_column}}
    AND source_data.{{multi_active_key_name}} = deduped_row_hashdiff.{{multi_active_key_name}}

),

records_to_insert AS (

    SELECT
        deduped_rows.{{parent_hashkey_name}},
        deduped_rows.{{multi_active_key_name}},
        deduped_rows.{{rsrc_column}}
        , deduped_rows.{{ldts_column}}
{{#descriptive_columns}}
        , deduped_rows.{{.}}
{{/descriptive_columns}}
    FROM deduped_rows
    WHERE NOT EXISTS (
        SELECT 1
        FROM latest_entries_in_sat
        WHERE latest_entries_in_sat.{{parent_hashkey_name}} = deduped_rows.{{parent_hashkey_name}}
            AND latest_entries_in_sat.{{multi_active_key_name}} = deduped_rows.{{multi_active_key_name}} 
            )

    )

SELECT * FROM records_to_insert

