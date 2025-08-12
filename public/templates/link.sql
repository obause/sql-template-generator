CREATE OR REPLACE TRANSIENT TABLE {{table_name}}
AS (

WITH
src_new_1 AS (
    SELECT
        {{link_hashkey_source_column}} AS {{link_hashkey_name}},
{{#related_hubs}}
        {{hub_source_column}} AS {{hub_hashkey_name}},
{{/related_hubs}}
        {{ldts_column}} AS ldts,
        {{rsrc_column}} AS rsrc{{#is_transactional}},{{/is_transactional}}
{{#is_transactional}}
{{#transactional_columns}}
        {{.}}{{^@last}},{{/@last}}
{{/transactional_columns}}
{{/is_transactional}}
    FROM {{source_table}} src
),

earliest_hk_over_all_sources AS (
    SELECT
        lcte.*
    FROM src_new_1 AS lcte
    QUALIFY ROW_NUMBER() OVER (PARTITION BY {{link_hashkey_name}} ORDER BY ldts) = 1
),

records_to_insert AS (
    SELECT
        {{link_hashkey_name}},
{{#related_hubs}}
        {{hub_hashkey_name}},
{{/related_hubs}}
        ldts,
        rsrc{{#is_transactional}},{{/is_transactional}}
{{#is_transactional}}
{{#transactional_columns}}
        {{.}}{{^@last}},{{/@last}}
{{/transactional_columns}}
{{/is_transactional}}
    FROM earliest_hk_over_all_sources
)

SELECT * FROM records_to_insert
)
;