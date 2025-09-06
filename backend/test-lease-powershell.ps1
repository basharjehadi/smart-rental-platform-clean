# PowerShell Lease Lifecycle Test Script
# 
# This script tests the lease renewal and termination system step by step

$BASE_URL = "http://localhost:3001/api"

# Utility functions
function Make-Request {
    param(
        [string]$Url,
        [hashtable]$Options = @{}
    )
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    if ($Options.Headers) {
        foreach ($key in $Options.Headers.Keys) {
            $headers[$key] = $Options.Headers[$key]
        }
    }
    
    $body = if ($Options.Body) { $Options.Body | ConvertTo-Json -Depth 10 } else { $null }
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL$Url" -Method $Options.Method -Headers $headers -Body $body
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message; Data = $_.Exception.Response }
    }
}

function Login {
    param(
        [string]$Email,
        [string]$Password
    )
    
    Write-Host "🔐 Logging in as $Email..." -ForegroundColor Yellow
    
    $result = Make-Request -Url "/auth/login" -Options @{
        Method = "POST"
        Body = @{
            email = $Email
            password = $Password
        }
    }
    
    if (-not $result.Success) {
        throw "Login failed: $($result.Error)"
    }
    
    return $result.Data.token
}

function Get-WithAuth {
    param(
        [string]$Url,
        [string]$Token
    )
    
    $result = Make-Request -Url $Url -Options @{
        Headers = @{
            Authorization = "Bearer $Token"
        }
    }
    
    if (-not $result.Success) {
        throw "Request failed: $($result.Error)"
    }
    
    return $result.Data
}

function Post-WithAuth {
    param(
        [string]$Url,
        [hashtable]$Body,
        [string]$Token
    )
    
    $result = Make-Request -Url $Url -Options @{
        Method = "POST"
        Headers = @{
            Authorization = "Bearer $Token"
        }
        Body = $Body
    }
    
    if (-not $result.Success) {
        throw "Request failed: $($result.Error)"
    }
    
    return $result.Data
}

# Test functions
function Find-ActiveLease {
    param([string]$TenantToken)
    
    Write-Host "🔍 Finding active lease..." -ForegroundColor Yellow
    
    $dashboard = Get-WithAuth -Url "/tenant-dashboard/dashboard" -Token $TenantToken
    $activeLease = $dashboard.leases | Where-Object { $_.status -eq "ACTIVE" -or $_.status -eq "SIGNED" } | Select-Object -First 1
    
    if (-not $activeLease) {
        throw "No active lease found for tenant@test.com"
    }
    
    Write-Host "✅ Found active lease: $($activeLease.id) ($($activeLease.status))" -ForegroundColor Green
    return $activeLease
}

function Test-RenewalRequest {
    param(
        [string]$TenantToken,
        [string]$LeaseId
    )
    
    Write-Host "`n🔄 Testing Renewal Request..." -ForegroundColor Yellow
    
    try {
        $renewalRequest = Post-WithAuth -Url "/leases/$LeaseId/renewals" -Body @{
            note = "Test renewal request from automated test"
        } -Token $TenantToken
        
        Write-Host "✅ Renewal request created: $($renewalRequest.renewalRequest.id)" -ForegroundColor Green
        return $renewalRequest.renewalRequest.id
    }
    catch {
        Write-Host "❌ Renewal request failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-LandlordProposal {
    param(
        [string]$LandlordToken,
        [string]$RenewalId
    )
    
    Write-Host "`n🏠 Testing Landlord Proposal..." -ForegroundColor Yellow
    
    try {
        $proposal = Post-WithAuth -Url "/renewals/$RenewalId/propose" -Body @{
            proposedTermMonths = 12
            proposedMonthlyRent = 1200
            proposedStartDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            note = "Test landlord proposal - 12 months, `$1200/month"
        } -Token $LandlordToken
        
        Write-Host "✅ Landlord proposal created" -ForegroundColor Green
        return $proposal
    }
    catch {
        Write-Host "❌ Landlord proposal failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-TenantResponse {
    param(
        [string]$TenantToken,
        [string]$RenewalId,
        [bool]$Accept = $true
    )
    
    $action = if ($Accept) { "Acceptance" } else { "Decline" }
    Write-Host "`n👤 Testing Tenant $action..." -ForegroundColor Yellow
    
    try {
        $response = Post-WithAuth -Url "/renewals/$RenewalId/respond" -Body @{
            accepted = $Accept
            note = "Test $($action.ToLower())"
        } -Token $TenantToken
        
        Write-Host "✅ Tenant $($action.ToLower())d proposal" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Tenant $action failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-TerminationRequest {
    param(
        [string]$TenantToken,
        [string]$LeaseId
    )
    
    Write-Host "`n🔚 Testing Termination Request..." -ForegroundColor Yellow
    
    try {
        $termination = Post-WithAuth -Url "/leases/$LeaseId/terminations" -Body @{
            proposedEndDate = (Get-Date).AddDays(60).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            reason = "Test termination request"
        } -Token $TenantToken
        
        Write-Host "✅ Termination request created: $($termination.terminationRequest.id)" -ForegroundColor Green
        return $termination.terminationRequest.id
    }
    catch {
        Write-Host "❌ Termination request failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-TerminationPolicy {
    param(
        [string]$TenantToken,
        [string]$LeaseId
    )
    
    Write-Host "`n📅 Testing Termination Policy..." -ForegroundColor Yellow
    
    try {
        $policy = Get-WithAuth -Url "/leases/$LeaseId/termination-policy" -Token $TenantToken
        
        Write-Host "✅ Termination policy preview:" -ForegroundColor Green
        Write-Host "   Cutoff Day: $($policy.cutoffDay)" -ForegroundColor Cyan
        Write-Host "   Min Notice: $($policy.minNoticeDays) days" -ForegroundColor Cyan
        Write-Host "   Earliest End: $($policy.earliestEnd)" -ForegroundColor Cyan
        Write-Host "   Explanation: $($policy.explanation)" -ForegroundColor Cyan
        
        return $policy
    }
    catch {
        Write-Host "❌ Termination policy test failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-LandlordTermination {
    param(
        [string]$LandlordToken,
        [string]$LeaseId
    )
    
    Write-Host "`n🏠 Testing Landlord Termination..." -ForegroundColor Yellow
    
    try {
        $termination = Post-WithAuth -Url "/leases/$LeaseId/terminations" -Body @{
            proposedEndDate = (Get-Date).AddDays(60).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            reason = "Test landlord termination request"
        } -Token $LandlordToken
        
        Write-Host "✅ Landlord termination request created: $($termination.terminationRequest.id)" -ForegroundColor Green
        return $termination.terminationRequest.id
    }
    catch {
        Write-Host "❌ Landlord termination failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-TerminationAcceptance {
    param(
        [string]$TenantToken,
        [string]$TerminationId
    )
    
    Write-Host "`n✅ Testing Termination Acceptance..." -ForegroundColor Yellow
    
    try {
        $response = Post-WithAuth -Url "/terminations/$TerminationId/accept" -Body @{
            note = "Test acceptance"
        } -Token $TenantToken
        
        Write-Host "✅ Termination accepted" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Termination acceptance failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-TerminationDecline {
    param(
        [string]$LandlordToken,
        [string]$TerminationId
    )
    
    Write-Host "`n❌ Testing Termination Decline..." -ForegroundColor Yellow
    
    try {
        $response = Post-WithAuth -Url "/terminations/$TerminationId/decline" -Body @{
            note = "Test decline"
        } -Token $LandlordToken
        
        Write-Host "✅ Termination declined" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Termination decline failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Main test runner
function Run-Test {
    Write-Host "🚀 Starting Lease Lifecycle Test" -ForegroundColor Magenta
    Write-Host "================================" -ForegroundColor Magenta
    
    $tenantToken = $null
    $landlordToken = $null
    $leaseId = $null
    
    try {
        # Login
        Write-Host "`n🔐 Logging in..." -ForegroundColor Yellow
        $tenantToken = Login -Email "tenant@test.com" -Password "password123"
        $landlordToken = Login -Email "landlord@test.com" -Password "password123"
        Write-Host "✅ Logged in successfully" -ForegroundColor Green
        
        # Find active lease
        $lease = Find-ActiveLease -TenantToken $tenantToken
        $leaseId = $lease.id
        
        # Test renewal workflow
        $separator = "=" * 50
        Write-Host "`n$separator" -ForegroundColor Magenta
        Write-Host "TESTING RENEWAL WORKFLOW" -ForegroundColor Magenta
        Write-Host $separator -ForegroundColor Magenta
        
        $renewalId = Test-RenewalRequest -TenantToken $tenantToken -LeaseId $leaseId
        Test-LandlordProposal -LandlordToken $landlordToken -RenewalId $renewalId
        Test-TenantResponse -TenantToken $tenantToken -RenewalId $renewalId -Accept $true
        
        # Test termination workflow
        Write-Host "`n$separator" -ForegroundColor Magenta
        Write-Host "TESTING TERMINATION WORKFLOW" -ForegroundColor Magenta
        Write-Host $separator -ForegroundColor Magenta
        
        Test-TerminationPolicy -TenantToken $tenantToken -LeaseId $leaseId
        $tenantTerminationId = Test-TerminationRequest -TenantToken $tenantToken -LeaseId $leaseId
        $landlordTerminationId = Test-LandlordTermination -LandlordToken $landlordToken -LeaseId $leaseId
        
        # Test termination responses
        Test-TerminationAcceptance -TenantToken $tenantToken -TerminationId $landlordTerminationId
        Test-TerminationDecline -LandlordToken $landlordToken -TerminationId $tenantTerminationId
        
        Write-Host "`n🎉 All tests completed successfully!" -ForegroundColor Green
        Write-Host "✅ Renewal workflow: PASSED" -ForegroundColor Green
        Write-Host "✅ Termination workflow: PASSED" -ForegroundColor Green
        Write-Host "✅ Termination policy: PASSED" -ForegroundColor Green
        
    }
    catch {
        Write-Host "`n❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Stack trace: $($_.Exception.StackTrace)" -ForegroundColor Red
        exit 1
    }
}

# Run the test
Run-Test


