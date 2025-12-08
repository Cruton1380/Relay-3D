# Kill all node.exe processes (except npm/current process tree)
Write-Host "Killing all node.exe processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    # Get the current process and its parent to avoid killing them
    $currentPid = $PID
    $parentProcesses = Get-WmiObject Win32_Process -Filter "ProcessId='$currentPid'" | Select-Object -ExpandProperty ParentProcessId
    
    # Filter out current process tree (npm and its children)
    $processesToKeep = @($currentPid, $parentProcesses)
    $processesToKill = $nodeProcesses | Where-Object { $processesToKeep -notcontains $_.Id }
    
    if ($processesToKill) {
        $count = ($processesToKill | Measure-Object).Count
        Write-Host "Found $count node process(es) to kill (excluding npm process tree)" -ForegroundColor Yellow
        
        $processesToKill | ForEach-Object { 
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue 
            Write-Host "Killed process $($_.Id)" -ForegroundColor Gray
        }
        
        # Wait for processes to die
        Start-Sleep -Seconds 2
        
        # Verify cleanup
        $remaining = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $processesToKeep -notcontains $_.Id }
        if ($remaining) {
            Write-Host "Some processes still running, trying harder..." -ForegroundColor Yellow
            $remaining | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 1
        }
        
        Write-Host "Cleanup complete! Killed $count old node processes." -ForegroundColor Green
    } else {
        Write-Host "No old node processes found to kill (npm process tree preserved)" -ForegroundColor Green
    }
} else {
    Write-Host "No node processes found to kill" -ForegroundColor Green
}
