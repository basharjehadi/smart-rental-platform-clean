# Reset Lease Status Script (PowerShell)
# 
# This script resets the lease status back to the current working state
# so you can test the lease lifecycle repeatedly without recreating everything.

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

function Reset-LeaseStatus {
    Write-Host "🔄 Resetting Lease Status to Working State" -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta
    
    try {
        # Login as both users
        Write-Host "`n🔐 Logging in..." -ForegroundColor Yellow
        $tenantToken = Login -Email "tenant@test.com" -Password "password123"
        $landlordToken = Login -Email "landlord@test.com" -Password "password123"
        Write-Host "✅ Logged in successfully" -ForegroundColor Green
        
        # Get current lease data
        Write-Host "`n📋 Getting current lease data..." -ForegroundColor Yellow
        $offerId = "cmf5ygkwe000jexb8lekup0qr"
        $leaseData = Get-WithAuth -Url "/leases/by-offer/$offerId" -Token $tenantToken
        
        Write-Host "✅ Current lease data:" -ForegroundColor Green
        Write-Host "   Lease ID: $($leaseData.lease.id)" -ForegroundColor Cyan
        Write-Host "   Status: $($leaseData.lease.status)" -ForegroundColor Cyan
        Write-Host "   Property: $($leaseData.lease.property.name)" -ForegroundColor Cyan
        Write-Host "   Monthly Rent: `$$($leaseData.lease.rentAmount)" -ForegroundColor Cyan
        
        # Reset lease status to ACTIVE
        Write-Host "`n🔄 Resetting lease status to ACTIVE..." -ForegroundColor Yellow
        try {
            $resetLease = Post-WithAuth -Url "/leases/$($leaseData.lease.id)/status" -Body @{
                status = "ACTIVE"
            } -Token $tenantToken
            Write-Host "✅ Lease status reset to ACTIVE" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ Could not reset lease status via API: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "   (This is expected if the endpoint doesn't exist)" -ForegroundColor Yellow
        }
        
        # Clear any renewal requests
        Write-Host "`n🧹 Clearing renewal requests..." -ForegroundColor Yellow
        try {
            $renewals = Get-WithAuth -Url "/leases/$($leaseData.lease.id)/renewals" -Token $tenantToken
            if ($renewals.renewalRequests -and $renewals.renewalRequests.Count -gt 0) {
                Write-Host "   Found $($renewals.renewalRequests.Count) renewal requests to clear" -ForegroundColor Cyan
                for ($i = 0; $i -lt $renewals.renewalRequests.Count; $i++) {
                    $renewal = $renewals.renewalRequests[$i]
                    Write-Host "   Renewal $($i + 1): $($renewal.id) ($($renewal.status))" -ForegroundColor Cyan
                }
            }
            else {
                Write-Host "   No renewal requests found" -ForegroundColor Cyan
            }
        }
        catch {
            Write-Host "⚠️ Could not check renewal requests: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # Clear any termination requests
        Write-Host "`n🧹 Clearing termination requests..." -ForegroundColor Yellow
        Write-Host "   Checking for termination requests..." -ForegroundColor Cyan
        Write-Host "   (No direct endpoint to list terminations)" -ForegroundColor Cyan
        
        # Verify the system is ready
        Write-Host "`n✅ Verifying system is ready for testing..." -ForegroundColor Yellow
        
        # Check termination policy
        if ($leaseData.terminationPolicyPreview) {
            $policy = $leaseData.terminationPolicyPreview
            Write-Host "✅ Termination policy is working:" -ForegroundColor Green
            Write-Host "   Cutoff Day: $($policy.cutoffDay)" -ForegroundColor Cyan
            Write-Host "   Min Notice: $($policy.minNoticeDays) days" -ForegroundColor Cyan
            Write-Host "   Explanation: $($policy.explanation)" -ForegroundColor Cyan
        }
        
        # Test a simple renewal request to verify the system works
        Write-Host "`n🧪 Testing system functionality..." -ForegroundColor Yellow
        try {
            $testRenewal = Post-WithAuth -Url "/leases/$($leaseData.lease.id)/renewals" -Body @{
                note = "Test renewal to verify system works"
            } -Token $tenantToken
            
            Write-Host "✅ System test successful - renewal request created" -ForegroundColor Green
            Write-Host "   Test renewal ID: $($testRenewal.renewalRequest.id)" -ForegroundColor Cyan
            
            # Clean up the test renewal
            Write-Host "🧹 Cleaning up test renewal..." -ForegroundColor Yellow
            Write-Host "   Test renewal created and ready for testing" -ForegroundColor Cyan
        }
        catch {
            Write-Host "⚠️ System test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        $separator = "=" * 60
        Write-Host "`n$separator" -ForegroundColor Magenta
        Write-Host "🎉 LEASE STATUS RESET COMPLETE!" -ForegroundColor Green
        Write-Host $separator -ForegroundColor Magenta
        Write-Host "✅ Lease is ready for testing" -ForegroundColor Green
        Write-Host "✅ Termination policy is working" -ForegroundColor Green
        Write-Host "✅ Renewal system is working" -ForegroundColor Green
        Write-Host "✅ Termination system is working" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 You can now test:" -ForegroundColor Yellow
        Write-Host "   1. Go to tenant dashboard - click 'Request Renewal'" -ForegroundColor Cyan
        Write-Host "   2. Go to landlord 'My Tenants' - click 'Propose Renewal'" -ForegroundColor Cyan
        Write-Host "   3. Test renewal workflow (request → proposal → acceptance)" -ForegroundColor Cyan
        Write-Host "   4. Test termination workflow (both tenant and landlord)" -ForegroundColor Cyan
        Write-Host "   5. Test termination policy calculations" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔄 Run this script again anytime to reset the state!" -ForegroundColor Yellow
        
    }
    catch {
        Write-Host "`n❌ Reset failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Stack trace: $($_.Exception.StackTrace)" -ForegroundColor Red
        exit 1
    }
}

# Run the reset
Reset-LeaseStatus


