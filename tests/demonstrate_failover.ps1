Write-Host "=== Multi-Region Failover Demonstration ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Verifying all services are running..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}"
Write-Host ""

Write-Host "Step 2: Testing US backend health through NGINX..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "http://localhost:8080/us/health" -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

Write-Host "Step 3: Making initial request to US region..." -ForegroundColor Yellow
$requestId = [guid]::NewGuid().ToString()
$body = @{
    price = 750000.00
    version = 1
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Request-ID" = $requestId
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/us/properties/5" -Method PUT -Body $body -Headers $headers -UseBasicParsing
    $response.Content | ConvertFrom-Json | ConvertTo-Json
} catch {
    Write-Host "Initial request may have failed (property might not exist or version conflict)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 4: Stopping US backend to simulate failure..." -ForegroundColor Yellow
docker stop backend-us
Write-Host "Waiting 10 seconds for health check to detect failure..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

Write-Host "Step 5: Making request to US endpoint (should failover to EU)..." -ForegroundColor Yellow
$requestId = [guid]::NewGuid().ToString()
$body = @{
    price = 850000.00
    version = 1
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Request-ID" = $requestId
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/us/properties/6" -Method PUT -Body $body -Headers $headers -UseBasicParsing
    $response.Content | ConvertFrom-Json | ConvertTo-Json
} catch {
    Write-Host "Request may have failed (property might not exist or version conflict)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 6: Checking NGINX logs for failover behavior..." -ForegroundColor Yellow
docker logs nginx_proxy --tail 10
Write-Host ""

Write-Host "Step 7: Checking EU backend logs to confirm it handled the request..." -ForegroundColor Yellow
docker logs backend-eu --tail 5
Write-Host ""

Write-Host "Step 8: Restarting US backend..." -ForegroundColor Yellow
docker start backend-us
Write-Host ""

Write-Host "=== Failover Test Complete ===" -ForegroundColor Green
Write-Host "Expected behavior: Request to /us/ endpoint was successfully handled by EU backend" -ForegroundColor Green