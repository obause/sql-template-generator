create or replace   view user_spaces.user_obause.snap_v1
  
  
  
  as (
    
    
    
    
    WITH 

latest_row AS (

    SELECT
        sdts
    FROM user_spaces.user_obause.snap_v0
    ORDER BY sdts DESC
    LIMIT 1

), 

virtual_logic AS (
    
    SELECT
        c.sdts,
        c.replacement_sdts,
        c.force_active,
        CASE 
            WHEN
            (DATE_TRUNC('DAY', c.sdts::DATE) BETWEEN CURRENT_DATE() - INTERVAL '3 MONTH' AND CURRENT_DATE()) OR            
              ((DATE_TRUNC('DAY', c.sdts::DATE) BETWEEN CURRENT_DATE() - INTERVAL '1 YEAR' AND CURRENT_DATE()) AND (c.is_weekly = TRUE)) OR            
              ((DATE_TRUNC('DAY', c.sdts::DATE) BETWEEN CURRENT_DATE() - INTERVAL '5 YEAR' AND CURRENT_DATE()) AND (c.is_monthly = TRUE)) OR
              (c.is_yearly = TRUE)
            THEN TRUE
            ELSE FALSE
        END AS is_active,

        CASE
            WHEN l.sdts IS NULL THEN FALSE
            ELSE TRUE
        END AS is_latest,

        c.caption,
        c.is_hourly,
        c.is_daily,
        c.is_weekly,
        c.is_monthly,
        c.is_yearly,
        CASE
            WHEN EXTRACT(YEAR FROM c.sdts) = EXTRACT(YEAR FROM CURRENT_DATE()) THEN TRUE
            ELSE FALSE
        END AS is_current_year,
        CASE
            WHEN EXTRACT(YEAR FROM c.sdts) = EXTRACT(YEAR FROM CURRENT_DATE())-1 THEN TRUE
            ELSE FALSE
        END AS is_last_year,
        CASE
            WHEN DATE_TRUNC('DAY', c.sdts::DATE) BETWEEN (CURRENT_DATE() - INTERVAL '1 YEAR') AND CURRENT_DATE() THEN TRUE
            ELSE FALSE
        END AS is_rolling_year,
        CASE
            WHEN DATE_TRUNC('DAY', c.sdts::DATE) BETWEEN (CURRENT_DATE() - INTERVAL '2 YEAR') AND (CURRENT_DATE() - INTERVAL '1 YEAR') THEN TRUE
            ELSE FALSE
        END AS is_last_rolling_year,
        c.comment
    FROM user_spaces.user_obause.snap_v0 c
    LEFT JOIN latest_row l
    ON c.sdts = l.sdts
),

active_logic_combined AS (

    SELECT 
        sdts,
        replacement_sdts,
        CASE
            WHEN force_active AND is_active THEN TRUE
            WHEN NOT force_active OR NOT is_active THEN FALSE
        END AS is_active,
        is_latest, 
        caption,
        is_hourly,
        is_daily,
        is_weekly,
        is_monthly,
        is_yearly,
        is_current_year,
        is_last_year,
        is_rolling_year,
        is_last_rolling_year,
        comment
    FROM virtual_logic

)

SELECT * FROM active_logic_combined
  );


