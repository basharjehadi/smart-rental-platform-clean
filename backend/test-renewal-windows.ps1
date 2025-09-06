# PowerShell End-to-End Test for Lease Renewal System
# Run with: .\test-renewal-windows.ps1

$BaseUrl = "http://localhost:3001/api"
$TestResults = @{
    Passed = 0
    Failed = 0
    Errors = @()
}

# Test configuration
$TestConfig = @{
    TenantEmail = "tenant@test.com"
    LandlordEmail = "landlord@test.com"
    AdminEmail = "admin@test.com"
    TenantToken = $null
    LandlordToken = $null
    AdminToken = $null
    TestLeaseId = $null
    TestRenewalId = $null
}

# Utility functions
function Write-TestLog {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    $prefix = switch ($Type) {
        "ERROR" { "❌" }
        "SUCCESS" { "✅" }
        default { "ℹ️" }
    }
    
    Write-Host "$prefix [$timestamp] $Message"
}

function Invoke-TestRequest {
    param(
        [string]$Url,
        [hashtable]$Options = @{}
    )
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Options.Headers) {
            foreach ($key in $Options.Headers.Keys) {
                $headers[$key] = $Options.Headers[$key]
            }
        }
        
        $body = $Options.Body
        $method = if ($Options.Method) { $Options.Method } else { "GET" }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl$Url" -Method $method -Headers $headers -Body $body -ErrorAction Stop
        
        return @{
            Success = $true
            Data = $response
        }
    }
    catch {
        Write-TestLog "Request failed: $($_.Exception.Message)" "ERROR"
        return @{
            Success = $false
            Data = $null
            Error = $_.Exception.Message
        }
    }
}

function Assert-Test {
    param(
        [bool]$Condition,
        [string]$Message
    )
    
    if ($Condition) {
        $TestResults.Passed++
        Write-TestLog "PASS: $Message" "SUCCESS"
    }
    else {
        $TestResults.Failed++
        $TestResults.Errors += $Message
        Write-TestLog "FAIL: $Message" "ERROR"
    }
}

# Test functions
function Test-Authentication {
    Write-TestLog "🔐 Testing Authentication..."
    
    # Test tenant login
    $tenantLogin = Invoke-TestRequest -Url "/auth/login" -Options @{
        Method = "POST"
        Body = (@{
            email = $TestConfig.TenantEmail
            password = "password123"
        } | ConvertTo-Json)
    }
    
    Assert-Test $tenantLogin.Success "Tenant login should succeed"
    if ($tenantLogin.Success) {
        $TestConfig.TenantToken = $tenantLogin.Data.token
    }
    
    # Test landlord login
    $landlordLogin = Invoke-TestRequest -Url "/auth/login" -Options @{
        Method = "POST"
        Body = (@{
            email = $TestConfig.LandlordEmail
            password = "password123"
        } | ConvertTo-Json)
    }
    
    Assert-Test $landlordLogin.Success "Landlord login should succeed"
    if ($landlordLogin.Success) {
        $TestConfig.LandlordToken = $landlordLogin.Data.token
    }
    
    # Test admin login
    $adminLogin = Invoke-TestRequest -Url "/auth/login" -Options @{
        Method = "POST"
        Body = (@{
            email = $TestConfig.AdminEmail
            password = "password123"
        } | ConvertTo-Json)
    }
    
    Assert-Test $adminLogin.Success "Admin login should succeed"
    if ($adminLogin.Success) {
        $TestConfig.AdminToken = $adminLogin.Data.token
    }
}

function Test-RenewalEndpoints {
    Write-TestLog "🔄 Testing Renewal Endpoints..."
    
    # Test 1: Get existing leases
    $leasesResponse = Invoke-TestRequest -Url "/leases" -Options @{
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
    }
    
    if ($leasesResponse.Success -and $leasesResponse.Data.leases -and $leasesResponse.Data.leases.Count -gt 0) {
        $TestConfig.TestLeaseId = $leasesResponse.Data.leases[0].id
        Write-TestLog "Using existing lease: $($TestConfig.TestLeaseId)"
    }
    else {
        Write-TestLog "No existing leases found. Skipping renewal tests." "ERROR"
        return
    }
    
    # Test 2: Tenant sends renewal request (note only)
    $tenantRenewalRequest = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewals" -Options @{
        Method = "POST"
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
        Body = (@{
            note = "I would like to renew my lease for another year"
        } | ConvertTo-Json)
    }
    
    Assert-Test $tenantRenewalRequest.Success "Tenant renewal request should succeed"
    if ($tenantRenewalRequest.Success) {
        $TestConfig.TestRenewalId = $tenantRenewalRequest.Data.renewal.id
        Write-TestLog "Created renewal request: $($TestConfig.TestRenewalId)"
    }
    
    # Test 3: Check that tenant cannot set terms/rent
    $tenantWithTermsRequest = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewals" -Options @{
        Method = "POST"
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
        Body = (@{
            note = "I want to renew"
            proposedTermMonths = 12
            proposedMonthlyRent = 1100
        } | ConvertTo-Json)
    }
    
    Assert-Test (-not $tenantWithTermsRequest.Success) "Tenant should not be able to set terms/rent"
    if (-not $tenantWithTermsRequest.Success) {
        Assert-Test ($tenantWithTermsRequest.Data.error -like "*cannot propose renewal terms*") "Should return appropriate error message"
    }
    
    # Test 4: Landlord proposes renewal terms
    $landlordProposal = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewals" -Options @{
        Method = "POST"
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.LandlordToken)"
        }
        Body = (@{
            proposedTermMonths = 12
            proposedMonthlyRent = 1100
            proposedStartDate = (Get-Date).AddDays(365).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            note = "Happy to renew with a 10% rent increase"
        } | ConvertTo-Json)
    }
    
    Assert-Test $landlordProposal.Success "Landlord proposal should succeed"
    
    # Test 5: Get renewal workflow state
    $workflowState = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewal-workflow" -Options @{
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
    }
    
    Assert-Test $workflowState.Success "Workflow state should be retrievable"
    if ($workflowState.Success) {
        $workflow = $workflowState.Data.workflow
        Assert-Test $workflow.hasActiveRenewal "Should have active renewal"
        Assert-Test $workflow.canAcceptRenewal "Tenant should be able to accept renewal"
        Assert-Test (-not $workflow.canRequestRenewal) "Tenant should not be able to request new renewal"
    }
    
    # Test 6: Get all renewals for the lease
    $renewalsList = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewals" -Options @{
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
    }
    
    Assert-Test $renewalsList.Success "Should be able to get renewals list"
    if ($renewalsList.Success) {
        Assert-Test ($renewalsList.Data.renewals.Count -gt 0) "Should have at least one renewal"
    }
    
    # Test 7: Tenant accepts renewal
    if ($TestConfig.TestRenewalId) {
        $acceptRenewal = Invoke-TestRequest -Url "/renewals/$($TestConfig.TestRenewalId)/accept" -Options @{
            Method = "POST"
            Headers = @{
                "Authorization" = "Bearer $($TestConfig.TenantToken)"
            }
        }
        
        Assert-Test $acceptRenewal.Success "Tenant should be able to accept renewal"
    }
}

function Test-SecurityPermissions {
    Write-TestLog "🛡️ Testing Security and Permissions..."
    
    if (-not $TestConfig.TestLeaseId) {
        Write-TestLog "Skipping security tests - no lease available" "ERROR"
        return
    }
    
    # Test 1: Unauthorized access (no token)
    $unauthorizedAccess = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewals" -Options @{
        Method = "POST"
        Body = (@{
            note = "Unauthorized request"
        } | ConvertTo-Json)
    }
    
    Assert-Test (-not $unauthorizedAccess.Success) "Unauthorized access should fail"
    
    # Test 2: Landlord trying to accept their own proposal
    if ($TestConfig.TestRenewalId) {
        $landlordSelfAccept = Invoke-TestRequest -Url "/renewals/$($TestConfig.TestRenewalId)/accept" -Options @{
            Method = "POST"
            Headers = @{
                "Authorization" = "Bearer $($TestConfig.LandlordToken)"
            }
        }
        
        Assert-Test (-not $landlordSelfAccept.Success) "Landlord should not be able to accept their own proposal"
    }
    
    # Test 3: Invalid renewal ID
    $invalidRenewalAccept = Invoke-TestRequest -Url "/renewals/invalid-id/accept" -Options @{
        Method = "POST"
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
    }
    
    Assert-Test (-not $invalidRenewalAccept.Success) "Invalid renewal ID should fail"
}

function Test-AutoExpiration {
    Write-TestLog "⏰ Testing Auto-Expiration..."
    
    # Test the auto-expiration endpoint
    $expireResponse = Invoke-TestRequest -Url "/renewals/expire-old" -Options @{
        Method = "POST"
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.AdminToken)"
        }
    }
    
    Assert-Test $expireResponse.Success "Auto-expiration endpoint should be accessible"
    if ($expireResponse.Success) {
        Assert-Test ($expireResponse.Data.expiredCount -is [int]) "Should return expired count"
    }
}

function Test-NotificationSystem {
    Write-TestLog "🔔 Testing Notification System..."
    
    if (-not $TestConfig.TestLeaseId) {
        Write-TestLog "Skipping notification tests - no lease available" "ERROR"
        return
    }
    
    # Test 1: Send a renewal request and check for notifications
    $tenantRequest = Invoke-TestRequest -Url "/leases/$($TestConfig.TestLeaseId)/renewals" -Options @{
        Method = "POST"
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.TenantToken)"
        }
        Body = (@{
            note = "Testing notification system"
        } | ConvertTo-Json)
    }
    
    Assert-Test $tenantRequest.Success "Renewal request should succeed for notification test"
    
    # Test 2: Check if notifications were created
    $notificationsResponse = Invoke-TestRequest -Url "/notifications" -Options @{
        Headers = @{
            "Authorization" = "Bearer $($TestConfig.LandlordToken)"
        }
    }
    
    if ($notificationsResponse.Success) {
        $notifications = $notificationsResponse.Data.notifications
        $renewalNotifications = $notifications | Where-Object { $_.title -like "*Renewal*" }
        
        Assert-Test ($renewalNotifications.Count -gt 0) "Should have renewal notifications"
    }
}

function Show-TestResults {
    Write-Host ""
    Write-Host ("=" * 60)
    Write-Host "📊 TEST RESULTS SUMMARY"
    Write-Host ("=" * 60)
    Write-Host "✅ Passed: $($TestResults.Passed)"
    Write-Host "❌ Failed: $($TestResults.Failed)"
    
    $successRate = if (($TestResults.Passed + $TestResults.Failed) -gt 0) {
        [math]::Round(($TestResults.Passed / ($TestResults.Passed + $TestResults.Failed)) * 100, 1)
    } else { 0 }
    
    Write-Host "📈 Success Rate: $successRate%"
    
    if ($TestResults.Errors.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ FAILED TESTS:"
        for ($i = 0; $i -lt $TestResults.Errors.Count; $i++) {
            Write-Host "$($i + 1). $($TestResults.Errors[$i])"
        }
    }
    
    Write-Host ""
    Write-Host ("=" * 60)
    
    if ($TestResults.Failed -eq 0) {
        Write-Host "🎉 ALL TESTS PASSED! The lease renewal system is working perfectly!"
    } else {
        Write-Host "⚠️  Some tests failed. Please review the errors above."
    }
    
    Write-Host ("=" * 60)
    Write-Host ""
}

# Main test runner
function Start-Tests {
    Write-Host "🚀 Starting Lease Renewal System Tests..."
    Write-Host "Make sure the backend server is running on port 3001"
    Write-Host ""
    
    try {
        Test-Authentication
        Test-RenewalEndpoints
        Test-SecurityPermissions
        Test-AutoExpiration
        Test-NotificationSystem
        
    } catch {
        Write-TestLog "Test execution error: $($_.Exception.Message)" "ERROR"
        $TestResults.Failed++
        $TestResults.Errors += "Test execution error: $($_.Exception.Message)"
    } finally {
        Show-TestResults
    }
}

# Run the tests
Start-Tests


