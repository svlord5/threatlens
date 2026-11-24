<#
.SYNOPSIS
ThreatLens SIEM Forwarder Agent for Windows.

.DESCRIPTION
This script monitors Windows Event Logs (Security and System) and forwards them 
in real-time to the ThreatLens SIEM dashboard via a REST API.

.NOTES
To run this script, you may need to bypass the execution policy on your VM:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#>

param (
    [string]$ApiUrl = $env:THREATLENS_INGEST_URL, # required, e.g. https://your-host/api/siem/ingest
    [string]$ApiKey = $env:SIEM_AGENT_API_KEY, # required: set SIEM_AGENT_API_KEY or pass -ApiKey
    [int]$BatchSize = 10,
    [int]$SleepSeconds = 5,
    [switch]$Isolate,
    [switch]$Recover
)

if ($Isolate) {
    Write-Host "=================================================" -ForegroundColor Red
    Write-Host "   INITIATING EMERGENCY HOST ISOLATION" -ForegroundColor Red
    Write-Host "=================================================" -ForegroundColor Red
    
    # Extract IP from ApiUrl
    $apiUri = [System.Uri]$ApiUrl
    $mgmtIp = $apiUri.Host

    Write-Host "Configuring Windows Firewall to block all traffic EXCEPT to $mgmtIp..." -ForegroundColor Yellow
    
    # Block all outbound
    New-NetFirewallRule -DisplayName "ThreatLens-Isolate-BlockOutbound" -Direction Outbound -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
    # Block all inbound
    New-NetFirewallRule -DisplayName "ThreatLens-Isolate-BlockInbound" -Direction Inbound -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
    
    # Allow outbound to SOC
    New-NetFirewallRule -DisplayName "ThreatLens-Isolate-AllowSOC" -Direction Outbound -RemoteAddress $mgmtIp -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    
    Write-Host "HOST SUCCESSFULLY ISOLATED." -ForegroundColor Red
    Write-Host "Network traffic is now severed. This agent will continue forwarding logs." -ForegroundColor DarkGray
    Write-Host ""
}

if ($Recover) {
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "   INITIATING HOST RECOVERY (UN-ISOLATION)" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    
    Write-Host "Removing ThreatLens Isolation Firewall Rules..." -ForegroundColor Yellow
    
    Remove-NetFirewallRule -DisplayName "ThreatLens-Isolate-BlockOutbound" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "ThreatLens-Isolate-BlockInbound" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "ThreatLens-Isolate-AllowSOC" -ErrorAction SilentlyContinue
    
    Write-Host "HOST SUCCESSFULLY RECOVERED. Network connectivity restored." -ForegroundColor Green
    Write-Host ""
    exit
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   ThreatLens Endpoint SIEM Forwarder Agent" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Target API: $ApiUrl" -ForegroundColor DarkGray
Write-Host "Monitoring: Security and System Logs" -ForegroundColor DarkGray
Write-Host ""

# Get the last event time to avoid sending old logs
$lastCheckTime = Get-Date

while ($true) {
    try {
        # Fetch new logs since the last check time
        $events = Get-WinEvent -FilterHashtable @{
            LogName = 'Security', 'System'
            StartTime = $lastCheckTime
        } -ErrorAction SilentlyContinue

        if ($events -and $events.Count -gt 0) {
            # Take the newest events up to the batch size, reverse them so oldest are sent first
            $batch = $events | Select-Object -First $BatchSize | Sort-Object TimeCreated
            
            $payload = @()
            foreach ($event in $batch) {
                $payload += @{
                    Id = $event.Id
                    TimeCreated = $event.TimeCreated.ToString("o")
                    ProviderName = $event.ProviderName
                    LevelDisplayName = $event.LevelDisplayName
                    Message = $event.Message
                    MachineName = $event.MachineName
                }
            }

            $jsonPayload = $payload | ConvertTo-Json -Depth 3 -Compress

            $headers = @{
                "Authorization" = "Bearer $ApiKey"
                "Content-Type" = "application/json"
            }

            # Send to ThreatLens API
            $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Headers $headers -Body $jsonPayload -ErrorAction Stop
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Successfully forwarded $($batch.Count) events." -ForegroundColor Green
            
            # Update last check time
            $lastCheckTime = $batch[-1].TimeCreated.AddTicks(1)
        }
    }
    catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Failed to forward events: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds $SleepSeconds
}
