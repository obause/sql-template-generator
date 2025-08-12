WITH

source_data AS (

    SELECT
        {{parent_hashkey_name}},
        {{hashdiff_name}} AS {{hashdiff_name}},
        {{rsrc_column}},
        {{ldts_column}},
{{#descriptive_columns}}
        {{.}}{{^@last}},{{/@last}}
{{/descriptive_columns}}
    FROM {{source_table}}
    WHERE {{ldts_column}} > (
        SELECT MAX({{ldts_column}})
        FROM {{table_name}}
        WHERE {{ldts_column}} != TO_TIMESTAMP('8888-12-31T23:59:59', 'YYYY-MM-DDTHH24:MI:SS')
    )
),

latest_entries_in_sat AS (

    SELECT
        {{parent_hashkey_name}},
        {{hashdiff_name}}
    FROM
        {{table_name}}
    QUALIFY ROW_NUMBER() OVER(PARTITION BY {{parent_hashkey_name}} ORDER BY {{ldts_column}} DESC) = 1
),


deduplicated_numbered_source AS (

    SELECT
        {{parent_hashkey_name}},
        {{hashdiff_name}},
        {{rsrc_column}},
        {{ldts_column}},
{{#descriptive_columns}}
        {{.}}{{^@last}},{{/@last}}
{{/descriptive_columns}}
      , ROW_NUMBER() OVER(PARTITION BY {{parent_hashkey_name}} ORDER BY {{ldts_column}}) as rn
    FROM source_data
    QUALIFY
        CASE
            WHEN {{hashdiff_name}} = LAG({{hashdiff_name}}) OVER(PARTITION BY {{parent_hashkey_name}} ORDER BY {{ldts_column}}) THEN FALSE
            ELSE TRUE
        END
),


records_to_insert AS (

    SELECT
        {{parent_hashkey_name}},
        {{hashdiff_name}},
        {{rsrc_column}},
        {{ldts_column}},
{{#descriptive_columns}}
        {{.}}{{^@last}},{{/@last}}
{{/descriptive_columns}}
    FROM deduplicated_numbered_source
    WHERE NOT EXISTS (
        SELECT 1
        FROM latest_entries_in_sat
        WHERE latest_entries_in_sat.{{parent_hashkey_name}} = deduplicated_numbered_source.{{parent_hashkey_name}}
          AND latest_entries_in_sat.{{hashdiff_name}} = deduplicated_numbered_source.{{hashdiff_name}}
          AND deduplicated_numbered_source.rn = 1
    )

    )

SELECT * FROM records_to_insert; 