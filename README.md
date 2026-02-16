# Multi-Region Property Listing Backend

A distributed property listing system with multi-region architecture featuring NGINX-based routing, PostgreSQL replication via Kafka, optimistic locking, and automatic failover capabilities.

## Architecture Overview

The system simulates a globally distributed application with two geographic regions (US and EU). Each region maintains its own PostgreSQL database and Node.js backend service. NGINX acts as a reverse proxy for intelligent routing and failover, while Apache Kafka handles asynchronous data replication between regions.

### Key Components

- **NGINX**: Reverse proxy with health-check based failover
- **PostgreSQL**: Regional databases (US and EU)
- **Apache Kafka**: Message broker for async replication
- **Node.js/Express**: Backend API services
- **Docker Compose**: Container orchestration

## Features

- Multi-region architecture with automatic failover
- Asynchronous data replication using Kafka
- Optimistic locking for concurrent update handling
- Idempotent API operations using request IDs
- Replication lag monitoring
- Health check endpoints

## Prerequisites

- Docker Desktop (Windows)
- Docker Compose
- Node.js 18+ (for running tests locally)
- Git
- Python 3.x (for data generation)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd multi-region-property-backend
```

### 2. Generate Sample Data

```bash
python seeds/generate_data.py
```

### 3. Start All Services

```bash
docker-compose up -d
```

Wait approximately 60-90 seconds for all services to become healthy.

### 4. Verify Services

```bash
curl http://localhost:8080/us/health
curl http://localhost:8080/eu/health
```

## API Endpoints

### Health Check

```
GET /:region/health
```

Response:

```json
{
  "status": "healthy",
  "region": "us"
}
```

### Update Property

```
PUT /:region/properties/:id
```

Headers:

- `X-Request-ID`: Unique request identifier (UUID)
- `Content-Type`: application/json

Request Body:

```json
{
  "price": 500000.0,
  "version": 1
}
```

Success Response (200):

```json
{
  "id": 123,
  "price": 500000.0,
  "version": 2,
  "updated_at": "2024-02-16T10:30:00.000Z"
}
```

Conflict Response (409):

```json
{
  "error": "Version conflict",
  "message": "The property has been modified by another request"
}
```

Duplicate Request Response (422):

```json
{
  "error": "Duplicate request",
  "message": "This request has already been processed"
}
```

### Get Replication Lag

```
GET /:region/replication-lag
```

Response:

```json
{
  "lag_seconds": 2.5
}
```

## Testing

### Install Test Dependencies

```bash
cd tests
npm install
cd ..
```

### Run Concurrent Update Test

```bash
cd tests
node test_concurrent_updates.js
```

This test validates optimistic locking by sending concurrent updates to the same property from both regions.

### Run Failover Demonstration

For Windows (using Git Bash or WSL):

```bash
bash tests/demonstrate_failover.sh
```

For Windows PowerShell:

```powershell
docker-compose up -d
Start-Sleep -Seconds 60
curl http://localhost:8080/us/health
docker stop backend-us
Start-Sleep -Seconds 5
curl http://localhost:8080/us/health
docker logs nginx_proxy
docker logs backend-eu
```

## System Behavior

### Optimistic Locking

The system implements optimistic locking using version numbers. When updating a property:

1. Client reads property with current version
2. Client sends update request with that version
3. Server updates only if version matches
4. If version mismatch occurs, server returns 409 Conflict

**Conflict Resolution**: Clients must fetch the latest version and retry the update with new data.

### Idempotency

All PUT requests require an `X-Request-ID` header. The system stores processed request IDs to detect and reject duplicates, ensuring exactly-once semantics even with network retries.

### Asynchronous Replication

When a property is updated in one region:

1. Update is committed to local database
2. Event is published to Kafka topic
3. Other region's consumer processes the event
4. Update is applied to remote database

This decoupled approach ensures low-latency writes while maintaining eventual consistency.

### Automatic Failover

NGINX monitors backend health and automatically routes traffic:

- Primary: Requests go to the region specified in URL path
- Failover: If primary is unhealthy, requests route to backup region
- Recovery: Traffic returns to primary when health is restored

## Database Schema

### Properties Table

| Column        | Type          | Constraints         | Description                    |
| ------------- | ------------- | ------------------- | ------------------------------ |
| id            | BIGINT        | PRIMARY KEY         | Unique property identifier     |
| price         | DECIMAL(12,2) | NOT NULL            | Property price                 |
| bedrooms      | INTEGER       |                     | Number of bedrooms             |
| bathrooms     | INTEGER       |                     | Number of bathrooms            |
| region_origin | VARCHAR(2)    | NOT NULL            | Origin region (us/eu)          |
| version       | INTEGER       | NOT NULL, DEFAULT 1 | Version for optimistic locking |
| updated_at    | TIMESTAMP     | NOT NULL            | Last update timestamp          |

### Processed Requests Table

| Column        | Type         | Constraints | Description               |
| ------------- | ------------ | ----------- | ------------------------- |
| request_id    | VARCHAR(255) | PRIMARY KEY | Unique request identifier |
| property_id   | BIGINT       | NOT NULL    | Associated property ID    |
| response_data | JSONB        | NOT NULL    | Cached response           |
| processed_at  | TIMESTAMP    | NOT NULL    | Processing timestamp      |

## Monitoring

### View NGINX Logs

```bash
docker logs nginx_proxy
```

### View Backend Logs

```bash
docker logs backend-us
docker logs backend-eu
```

### View Kafka Logs

```bash
docker logs kafka
```

### Connect to Database

US Region:

```bash
docker exec -it db-us psql -U postgres -d properties_us
```

EU Region:

```bash
docker exec -it db-eu psql -U postgres -d properties_eu
```

## Troubleshooting

### Services Won't Start

```bash
docker-compose down -v
docker-compose up -d
```

### Health Checks Failing

Wait longer for services to initialize (up to 2 minutes for Kafka).

### Database Connection Errors

Ensure PostgreSQL containers are healthy:

```bash
docker ps
```

### Replication Not Working

Check Kafka is running and topic exists:

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

## Cleanup

```bash
docker-compose down -v
```

This removes all containers, networks, and volumes.

## Environment Variables

See `.env.example` for all configurable environment variables.

## Technology Stack

- Node.js 18
- Express.js 4.18
- PostgreSQL 14
- Apache Kafka 7.0.1
- NGINX Latest
- Docker & Docker Compose
- KafkaJS 2.2.4

## License

MIT
