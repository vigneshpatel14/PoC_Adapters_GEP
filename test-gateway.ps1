# Test Chat Gateway API
# This script tests the gateway with different platforms

Write-Host "Chat Gateway Test Script" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Web Platform
Write-Host "Test 1: Web Platform Message" -ForegroundColor Yellow
$body1 = @{
    message = "hello"
    userId = "web-user-1"
    tenantId = "default"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" `
        -Method "POST" `
        -ContentType "application/json" `
        -Body $body1 `
        -ErrorAction Stop
    
    $result1 = $response1.Content | ConvertFrom-Json
    Write-Host "✓ Success" -ForegroundColor Green
    Write-Host "Response: $($result1.response)" -ForegroundColor Green
    Write-Host "Session ID: $($result1.sessionId)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 2: Different message with same user (should reuse session)
Write-Host "Test 2: Same User, Different Message" -ForegroundColor Yellow
$body2 = @{
    message = "help"
    userId = "web-user-1"
    tenantId = "default"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" `
        -Method "POST" `
        -ContentType "application/json" `
        -Body $body2 `
        -ErrorAction Stop
    
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "✓ Success" -ForegroundColor Green
    Write-Host "Response: $($result2.response)" -ForegroundColor Green
    Write-Host "Session ID: $($result2.sessionId)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 3: Check health
Write-Host "Test 3: Health Check" -ForegroundColor Yellow
try {
    $response3 = Invoke-WebRequest -Uri "http://localhost:3000/health" `
        -Method "GET" `
        -ErrorAction Stop
    
    $result3 = $response3.Content | ConvertFrom-Json
    Write-Host "✓ Success" -ForegroundColor Green
    Write-Host "Status: $($result3.status)" -ForegroundColor Green
    Write-Host "Adapters: $($result3.adapters -join ', ')" -ForegroundColor Cyan
    Write-Host "Tenants: $($result3.tenants -join ', ')" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 4: List sessions
Write-Host "Test 4: List Sessions" -ForegroundColor Yellow
try {
    $response4 = Invoke-WebRequest -Uri "http://localhost:3000/api/sessions" `
        -Method "GET" `
        -ErrorAction Stop
    
    $result4 = $response4.Content | ConvertFrom-Json
    Write-Host "✓ Success" -ForegroundColor Green
    Write-Host "Total Sessions: $($result4.Length)" -ForegroundColor Green
    if ($result4.Length -gt 0) {
        foreach ($session in $result4) {
            Write-Host "  - Session: $($session.sessionId)" -ForegroundColor Cyan
            Write-Host "    User: $($session.userId), Platform: $($session.platform)" -ForegroundColor Cyan
        }
    }
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host "Gateway Testing Complete!" -ForegroundColor Cyan
