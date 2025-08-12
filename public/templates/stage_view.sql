CREATE OR REPLACE VIEW {{view_name}}
AS (

WITH

source_data AS (
    SELECT
{{#auto_include_all_source_columns}}
        *,
{{/auto_include_all_source_columns}}
{{^auto_include_all_source_columns}}
{{#source_columns}}
        {{name}},
{{/source_columns}}
{{/auto_include_all_source_columns}}
    FROM {{source_table}}
),

ldts_rsrc_data AS (
    SELECT
        {{#use_current_timestamp}}CAST(SYSDATE() AS TIMESTAMP_TZ) AS ldts,{{/use_current_timestamp}}{{^use_current_timestamp}}{{load_date_column}} AS ldts,{{/use_current_timestamp}}
        {{#use_static_record_source}}CAST('{{record_source_value}}' AS VARCHAR) AS rsrc,{{/use_static_record_source}}{{^use_static_record_source}}{{record_source_value}} AS rsrc,{{/use_static_record_source}}
{{#auto_include_all_source_columns}}
        sd.*,
{{/auto_include_all_source_columns}}
{{^auto_include_all_source_columns}}
{{#source_columns}}
        {{name}},
{{/source_columns}}
{{/auto_include_all_source_columns}}
    FROM source_data sd
),

hashed_columns AS (
    SELECT
{{#auto_include_all_source_columns}}
        lrd.*,
{{/auto_include_all_source_columns}}
{{^auto_include_all_source_columns}}
        LDTS,
        RSRC,
{{#source_columns}}
        {{name}},
{{/source_columns}}
{{/auto_include_all_source_columns}}
{{#hashkeys}}
        IFNULL(LOWER(MD5(NULLIF(CAST(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(
{{business_keys_concat}}
        ), '\n', '')
        , '\t', '')
        , '\v', '')
        , '\r', '') AS STRING), {{business_keys_nullif}}))), '00000000000000000000000000000000') AS {{name}},
{{/hashkeys}}
{{#hashdiffs}}
        IFNULL(LOWER(MD5(NULLIF(CAST(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(
{{columns_concat}}
        ), '\n', '')
        , '\t', '')
        , '\v', '')
        , '\r', '') AS STRING), {{columns_nullif}}))), '00000000000000000000000000000000') AS {{name}}{{^@last}},{{/@last}}
{{/hashdiffs}}
    FROM ldts_rsrc_data {{#auto_include_all_source_columns}}lrd{{/auto_include_all_source_columns}}
)

{{^auto_include_all_source_columns}}
,
unknown_values AS (
    SELECT
        TO_TIMESTAMP('0001-01-01T00:00:01', 'YYYY-MM-DDTHH24:MI:SS') AS ldts,
        'SYSTEM' AS rsrc,
{{#source_columns}}
        {{#@is_numeric}}-1{{/@is_numeric}}{{^@is_numeric}}{{#@is_timestamp}}TO_TIMESTAMP('0001-01-01T00:00:01', 'YYYY-MM-DDTHH24:MI:SS'){{/@is_timestamp}}{{^@is_timestamp}}'(unknown)'{{/@is_timestamp}}{{/@is_numeric}} AS {{name}},
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
        {{#@is_numeric}}-2{{/@is_numeric}}{{^@is_numeric}}{{#@is_timestamp}}TO_TIMESTAMP('8888-12-31T23:59:59', 'YYYY-MM-DDTHH24:MI:SS'){{/@is_timestamp}}{{^@is_timestamp}}'(error)'{{/@is_timestamp}}{{/@is_numeric}} AS {{name}},
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
        LDTS,
        RSRC,
{{#source_columns}}
        {{name}},
{{/source_columns}}
{{#hashkeys}}
        {{name}},
{{/hashkeys}}
{{#hashdiffs}}
        {{name}}{{^@last}},{{/@last}}
{{/hashdiffs}}
    FROM hashed_columns
    UNION ALL
    SELECT
        LDTS,
        RSRC,
{{#source_columns}}
        {{name}},
{{/source_columns}}
{{#hashkeys}}
        {{name}},
{{/hashkeys}}
{{#hashdiffs}}
        {{name}}{{^@last}},{{/@last}}
{{/hashdiffs}}
    FROM ghost_records
)
{{/auto_include_all_source_columns}}

SELECT * FROM {{#auto_include_all_source_columns}}hashed_columns{{/auto_include_all_source_columns}}{{^auto_include_all_source_columns}}columns_to_select{{/auto_include_all_source_columns}}
);