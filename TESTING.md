# Testing Guide

## Prerequisites

- Docker and Docker Compose running
- All services healthy and running
- Test dependencies installed (`npm install` in tests directory)

## Manual Testing

### 1. Health Check Test

Test both regional health endpoints:

```bash
curl http://localhost:8080/us/health
curl http://localhost:8080/eu/health
```

Expected: Both return `{"status":"healthy","region":"us/eu"}`

### 2. Property Update Test

Update a property in the US region:

```bash
curl -X PUT http://localhost:8080/us/properties/10 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-update-001" \
  -d "{\"price\": 500000.00, \"version\": 1}"
```

Expected: 200 OK with updated property data including incremented version

### 3. Optimistic Locking Test

Try updating with an outdated version:

```bash
curl -X PUT http://localhost:8080/us/properties/10 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-conflict-001" \
  -d "{\"price\": 600000.00, \"version\": 1}"
```

Expected: 409 Conflict error

### 4. Idempotency Test

Send the same request twice:

```bash
curl -X PUT http://localhost:8080/us/properties/11 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: duplicate-test-123" \
  -d "{\"price\": 450000.00, \"version\": 1}"

curl -X PUT http://localhost:8080/us/properties/11 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: duplicate-test-123" \
  -d "{\"price\": 450000.00, \"version\": 1}"
```

Expected: First request succeeds (200), second returns 422 Duplicate Request

### 5. Replication Test

Update in US and verify in EU database:

```bash
curl -X PUT http://localhost:8080/us/properties/12 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: replication-test-001" \
  -d "{\"price\": 750000.00, \"version\": 1}"

timeout /t 3

docker exec -it db-eu psql -U postgres -d properties_eu \
  -c "SELECT id, price, version, region_origin FROM properties WHERE id = 12;"
```

Expected: Property appears in EU database with same price, version, and region_origin='us'

### 6. Replication Lag Test

```bash
curl http://localhost:8080/eu/replication-lag
```

Expected: Returns `{"lag_seconds": <number>}` where number is small (< 5 seconds)

## Automated Tests

### Concurrent Updates Test

```bash
cd tests
node test_concurrent_updates.js
```

**Purpose**: Validates optimistic locking prevents race conditions

**Expected Result**: One request succeeds (200), one fails with conflict (409)

### Failover Demonstration

Windows PowerShell:

```powershell
cd tests
powershell -ExecutionPolicy Bypass -File .\demonstrate_failover.ps1
```

Linux/Mac:

```bash
cd tests
bash demonstrate_failover.sh
```

**Purpose**: Demonstrates NGINX automatic failover capability

**Expected Behavior**:

1. Initial requests to /us/ go to backend-us
2. After stopping backend-us, requests to /us/ are handled by backend-eu
3. NGINX logs show upstream failover
4. EU backend logs show it processed the /us/ requests

## Database Verification

### Connect to Databases

US Database:

```bash
docker exec -it db-us psql -U postgres -d properties_us
```

EU Database:

```bash
docker exec -it db-eu psql -U postgres -d properties_eu
```

### Verify Schema

```sql
\d properties
\d processed_requests
```

### Check Data

```sql
SELECT COUNT(*) FROM properties;
SELECT * FROM properties LIMIT 5;
SELECT * FROM processed_requests LIMIT 5;
```

## Kafka Verification

### List Topics

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

Expected: `property-updates` topic exists

### Consume Messages

```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic property-updates \
  --from-beginning
```

## Log Inspection

### NGINX Logs

```bash
docker logs nginx_proxy
```

Look for: upstream_response_time, status codes, failover attempts

### Backend Logs

```bash
docker logs backend-us
docker logs backend-eu
```

Look for: Kafka connection, replication messages, errors

### Kafka Logs

```bash
docker logs kafka
```

## Troubleshooting

### Services Won't Start

```bash
docker-compose down -v
docker-compose up -d --build
```

### Health Checks Failing

Wait 2-3 minutes for all services to initialize, especially Kafka.

### Replication Not Working

Check Kafka topic exists and consumers are connected:

```bash
docker logs backend-us | grep "Kafka"
docker logs backend-eu | grep "Kafka"
```

### Database Connection Issues

Verify database containers are healthy:

```bash
docker ps
```

Check database logs:

```bash
docker logs db-us
docker logs db-eu
```
