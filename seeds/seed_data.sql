CREATE TEMP TABLE temp_properties (
    id BIGINT,
    price DECIMAL(12, 2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1)
);

COPY temp_properties(id, price, bedrooms, bathrooms)
FROM '/docker-entrypoint-initdb.d/properties_dataset.csv'
DELIMITER ','
CSV HEADER;

INSERT INTO properties (id, price, bedrooms, bathrooms, region_origin, version, updated_at)
SELECT 
    id,
    price,
    bedrooms,
    bathrooms::INTEGER,
    CASE 
        WHEN id <= 1000 THEN 'us'
        ELSE 'eu'
    END as region_origin,
    1 as version,
    NOW() as updated_at
FROM temp_properties;

DROP TABLE temp_properties;