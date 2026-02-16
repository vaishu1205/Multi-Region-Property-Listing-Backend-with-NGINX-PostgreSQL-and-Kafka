-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id BIGINT PRIMARY KEY,
    price DECIMAL(12, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    region_origin VARCHAR(2) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on region_origin for faster queries
CREATE INDEX idx_properties_region ON properties(region_origin);

-- Create index on updated_at for replication lag calculations
CREATE INDEX idx_properties_updated_at ON properties(updated_at);

-- Create idempotency table to store processed request IDs
CREATE TABLE IF NOT EXISTS processed_requests (
    request_id VARCHAR(255) PRIMARY KEY,
    property_id BIGINT NOT NULL,
    response_data JSONB NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on processed_at for cleanup operations
CREATE INDEX idx_processed_requests_time ON processed_requests(processed_at);