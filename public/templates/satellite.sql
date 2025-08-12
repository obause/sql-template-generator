CREATE OR REPLACE TRANSIENT TABLE {{table_name}}
AS (

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
)

SELECT * FROM records_to_insert
);


