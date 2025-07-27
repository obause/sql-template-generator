CREATE OR REPLACE VIEW {{#schema_name}}{{schema_name}}.{{/schema_name}}{{view_name}}
AS (

WITH

source_data AS (
    SELECT
{{#source_columns}}
        "{{.}}",
{{/source_columns}}
    FROM {{source_table}}
),

ldts_rsrc_data AS (
    SELECT
        {{#use_current_timestamp}}CAST(SYSDATE() AS TIMESTAMP_TZ) AS ldts,{{/use_current_timestamp}}{{^use_current_timestamp}}"{{load_date_column}}" AS ldts,{{/use_current_timestamp}}
        {{#use_static_record_source}}CAST('{{record_source_value}}' AS VARCHAR) AS rsrc,{{/use_static_record_source}}{{^use_static_record_source}}"{{record_source_value}}" AS rsrc,{{/use_static_record_source}}
{{#source_columns}}
        "{{.}}",
{{/source_columns}}
    FROM source_data
),

hashed_columns AS (
    SELECT
        "LDTS",
        "RSRC",
{{#source_columns}}
        "{{.}}",
{{/source_columns}}
{{#hashkeys}}
        IFNULL(LOWER(MD5(NULLIF(CAST(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(
{{#business_keys}}
            IFNULL((CONCAT('"', REPLACE(REPLACE(REPLACE(TRIM(CAST("{{.}}" AS STRING)), '\\', '\\\\'), '"', '\"'), '^^', '--'), '"')), '^^'){{^@last}},'||',{{/@last}}
{{/business_keys}}
        ), '\n', '')
        , '\t', '')
        , '\v', '')
        , '\r', '') AS STRING), '{{#business_keys}}^^{{^@last}}||^^{{/@last}}{{/business_keys}}'))), '00000000000000000000000000000000') AS {{name}},
{{/hashkeys}}
{{#hashdiffs}}
        IFNULL(LOWER(MD5(NULLIF(CAST(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(
{{#columns}}
            IFNULL((CONCAT('"', REPLACE(REPLACE(REPLACE(TRIM(CAST("{{.}}" AS STRING)), '\\', '\\\\'), '"', '\"'), '^^', '--'), '"')), '^^'){{^@last}},'||',{{/@last}}
{{/columns}}
        ), '\n', '')
        , '\t', '')
        , '\v', '')
        , '\r', '') AS STRING), '{{#columns}}^^{{^@last}}||^^{{/@last}}{{/columns}}'))), '00000000000000000000000000000000') AS {{name}}{{^@last}},{{/@last}}
{{/hashdiffs}}
    FROM ldts_rsrc_data
),

unknown_values AS (
    SELECT
        TO_TIMESTAMP('0001-01-01T00:00:01', 'YYYY-MM-DDTHH24:MI:SS') AS ldts,
        'SYSTEM' AS rsrc,
{{#source_columns}}
        {{#@is_numeric}}-1{{/@is_numeric}}{{^@is_numeric}}'(unknown)'{{/@is_numeric}} AS "{{.}}",
{{/source_columns}}
{{#hashkeys}}
        CAST('00000000000000000000000000000000' AS STRING) AS {{name}},
{{/hashkeys}}
{{#hashdiffs}}
        CAST('00000000000000000000000000000000' AS STRING) AS {{name}}{{^@last}},{{/@last}}
{{/hashdiffs}}
),

error_values AS (
    SELECT
        TO_TIMESTAMP('8888-12-31T23:59:59', 'YYYY-MM-DDTHH24:MI:SS') AS ldts,
        'ERROR' AS rsrc,
{{#source_columns}}
        {{#@is_numeric}}-2{{/@is_numeric}}{{^@is_numeric}}'(error)'{{/@is_numeric}} AS "{{.}}",
{{/source_columns}}
{{#hashkeys}}
        CAST('ffffffffffffffffffffffffffffffff' AS STRING) AS {{name}},
{{/hashkeys}}
{{#hashdiffs}}
        CAST('ffffffffffffffffffffffffffffffff' AS STRING) AS {{name}}{{^@last}},{{/@last}}
{{/hashdiffs}}
),

ghost_records AS (
    SELECT * FROM unknown_values
    UNION ALL
    SELECT * FROM error_values
),

columns_to_select AS (
    SELECT
        "LDTS",
        "RSRC",
{{#source_columns}}
        "{{.}}",
{{/source_columns}}
{{#hashkeys}}
        "{{name}}",
{{/hashkeys}}
{{#hashdiffs}}
        "{{name}}"{{^@last}},{{/@last}}
{{/hashdiffs}}
    FROM hashed_columns
    UNION ALL
    SELECT
        "LDTS",
        "RSRC",
{{#source_columns}}
        "{{.}}",
{{/source_columns}}
{{#hashkeys}}
        "{{name}}",
{{/hashkeys}}
{{#hashdiffs}}
        "{{name}}"{{^@last}},{{/@last}}
{{/hashdiffs}}
    FROM ghost_records
)

SELECT * FROM columns_to_select
); 