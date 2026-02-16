#!/bin/bash

echo "=== Multi-Region Failover Demonstration ==="
echo ""

echo "Step 1: Starting all services..."
docker-compose up -d
echo "Waiting for services to become healthy (60 seconds)..."
sleep 60
echo ""

echo "Step 2: Testing US backend health through NGINX..."
curl -s http://localhost:8080/us/health | jq .
echo ""

echo "Step 3: Making initial request to US region..."
REQUEST_ID=$(uuidgen)
curl -s -X PUT http://localhost:8080/us/properties/5 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $REQUEST_ID" \
  -d '{"price": 750000.00, "version": 1}' | jq .
echo ""

echo "Step 4: Stopping US backend to simulate failure..."
docker stop backend-us
echo "Waiting 5 seconds for health check to detect failure..."
sleep 5
echo ""

echo "Step 5: Making request to US endpoint (should failover to EU)..."
REQUEST_ID=$(uuidgen)
curl -s -X PUT http://localhost:8080/us/properties/6 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $REQUEST_ID" \
  -d '{"price": 850000.00, "version": 1}' | jq .
echo ""

echo "Step 6: Checking NGINX logs for failover behavior..."
docker logs nginx_proxy 2>&1 | tail -n 10
echo ""

echo "Step 7: Checking EU backend logs to confirm it handled the request..."
docker logs backend-eu 2>&1 | tail -n 5
echo ""

echo "=== Failover Test Complete ==="
echo "Expected behavior: Request to /us/ endpoint was successfully handled by EU backend"