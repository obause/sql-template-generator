CREATE OR REPLACE TRANSIENT TABLE {{table_name}}
AS (

WITH
{{#sources}}
    src_new_{{@index}} AS (
        SELECT
            {{hashkey_source_column}} AS {{hub_hashkey_name}},
            {{business_key_source_column}} AS {{hub_business_key_name}},
            {{ldts_column}} AS ldts,
            {{rsrc_column}} AS rsrc
        FROM {{table}} src
    ),
{{/sources}}

    source_new_union AS (
{{#sources}}
        SELECT
            {{hub_hashkey_name}},
            {{hub_business_key_name}},
            ldts,
            rsrc
        FROM src_new_{{@index}}
        {{^@last}}UNION ALL{{/@last}}
{{/sources}}
    ),

    earliest_hk_over_all_sources AS (
        SELECT
            lcte.*
        FROM source_new_union AS lcte
        QUALIFY ROW_NUMBER() OVER (PARTITION BY {{hub_hashkey_name}} ORDER BY ldts) = 1
    ),

    records_to_insert AS (
        SELECT
            {{hub_hashkey_name}},
            {{hub_business_key_name}},
            ldts,
            rsrc
        FROM earliest_hk_over_all_sources
    )

SELECT * FROM records_to_insert
); 