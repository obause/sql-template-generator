WITH

existing_dimension_keys AS (
    SELECT {{dimension_key_name}} FROM {{table_name}}
),

pit_records AS (
    SELECT
        IFNULL(LOWER(MD5(NULLIF(CAST(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(
            IFNULL((CONCAT('"', REPLACE(REPLACE(REPLACE(TRIM(CAST({{tracked_entity_hashkey}} AS STRING)), '\\', '\\\\'), '"', '\\"'), '^^', '--'), '"')), '^^'),'||',
            IFNULL((CONCAT('"', REPLACE(REPLACE(REPLACE(TRIM(CAST(snap.sdts AS STRING)), '\\', '\\\\'), '"', '\\"'), '^^', '--'), '"')), '^^')
        ), '\n', '') , '\t', '') , '\v', '') , '\r', '') AS STRING), '^^||^^'))), '00000000000000000000000000000000') AS {{dimension_key_name}},
        {{tracked_entity_hashkey}} AS tracked_entity_hk,
        snap.sdts,
{{#satellites}}
        COALESCE({{alias}}.{{../tracked_entity_hashkey}}, CAST('00000000000000000000000000000000' as STRING)) AS {{alias}},
        COALESCE({{alias}}.ldts, TO_TIMESTAMP('0001-01-01T00:00:01', 'YYYY-MM-DDTHH24:MI:SS')) AS ldts_{{alias}}{{^@last}},{{/@last}}
{{/satellites}}
    FROM
            {{tracked_entity}} te
        FULL OUTER JOIN
            {{snapshot_table}} snap
            ON snap.is_active = true
{{#satellites}}
        LEFT JOIN {{table}} {{alias}}
            ON {{alias}}.{{../tracked_entity_hashkey}} = te.{{../tracked_entity_hashkey}} AND snap.sdts BETWEEN {{alias}}.ldts AND {{alias}}.ledts
{{/satellites}}
    WHERE snap.is_active
),

new_records AS (
    SELECT * FROM pit_records
    WHERE {{dimension_key_name}} NOT IN (SELECT {{dimension_key_name}} FROM existing_dimension_keys)
)

SELECT * FROM new_records;


