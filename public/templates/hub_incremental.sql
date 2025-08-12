WITH

    distinct_target_hashkeys AS (
        SELECT
            {{hub_hashkey_name}}
        FROM {{table_name}}
    ),

{{#sources}}
    rsrc_static_{{@index}} AS (
        SELECT 
            t.*,
            '{{rsrc_static}}' AS rsrc_static
        FROM {{table_name}} t
        WHERE t.{{rsrc_column}} LIKE '{{rsrc_static}}'
    ),
{{/sources}}

    rsrc_static_union AS (
{{#sources}}
        SELECT rsrc_static_{{@index}}.* FROM rsrc_static_{{@index}}
        {{^@last}}UNION ALL{{/@last}}
{{/sources}}
    ),

    max_ldts_per_rsrc_static_in_target AS (
        SELECT
            rsrc_static,
            MAX(ldts) AS max_ldts
        FROM rsrc_static_union
        WHERE ldts != TO_TIMESTAMP('8888-12-31T23:59:59', 'YYYY-MM-DDTHH24:MI:SS')
        GROUP BY rsrc_static
    ),

{{#sources}}
    src_new_{{@index}} AS (
        SELECT
            {{hashkey_source_column}} AS {{hub_hashkey_name}},
            {{business_key_source_column}} AS {{hub_business_key_name}},
            {{ldts_column}} AS ldts,
            {{rsrc_column}} AS rsrc
        FROM {{table}} src
        INNER JOIN max_ldts_per_rsrc_static_in_target max ON (max.rsrc_static = '{{rsrc_static}}')
        WHERE src.{{ldts_column}} > max.max_ldts
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
        WHERE {{hub_hashkey_name}} NOT IN (SELECT * FROM distinct_target_hashkeys)
    )

SELECT * FROM records_to_insert; 