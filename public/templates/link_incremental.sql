WITH

    distinct_target_hashkeys AS (
        SELECT
            {{link_hashkey_name}}
        FROM {{table_name}}
    ),

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
            {{.}}
{{^@last}},{{/@last}}
{{/transactional_columns}}
{{/is_transactional}}
        FROM {{source_table}} src
        WHERE src.{{ldts_column}} > (
            SELECT MAX(ldts)
            FROM {{table_name}}
            WHERE ldts != TO_TIMESTAMP('8888-12-31T23:59:59', 'YYYY-MM-DDTHH24:MI:SS')
        )
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
            {{.}}
{{^@last}},{{/@last}}
{{/transactional_columns}}
{{/is_transactional}}
        FROM earliest_hk_over_all_sources
        WHERE {{link_hashkey_name}} NOT IN (SELECT * FROM distinct_target_hashkeys)
    )

SELECT * FROM records_to_insert; 