# GoldFoundry Watchdog v2 - startet NUR wenn Prozess FEHLT
# Keine Duplikate, kein PM2, kein Chaos

$py = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -match 'Python312' }
if (-not $py) {
    Add-Content 'C:\signal-bot\watchdog.log' "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Signal Bot war tot - starte neu"
    Start-Process 'C:\Python312\python.exe' -ArgumentList 'bot.py' -WorkingDirectory 'C:\signal-bot' -WindowStyle Hidden
}

$nodes = Get-Process node -ErrorAction SilentlyContinue
$hasCopy = $false
$hasEngine = $false
$hasMonitor = $false

foreach ($n in $nodes) {
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($n.Id)").CommandLine
        if ($cmd -match 'copy-bot') { $hasCopy = $true }
        if ($cmd -match 'engine-runner') { $hasEngine = $true }
        if ($cmd -match 'trade-monitor') { $hasMonitor = $true }
    } catch {}
}

if (-not $hasCopy) {
    Add-Content 'C:\signal-bot\watchdog.log' "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Copy Bot war tot - starte neu"
    Start-Process 'C:\Program Files\nodejs\node.exe' -ArgumentList 'copy-bot.mjs' -WorkingDirectory 'C:\signal-bot' -WindowStyle Hidden
}

if (-not $hasEngine) {
    Add-Content 'C:\signal-bot\watchdog.log' "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Engine Runner war tot - starte neu"
    Start-Process 'C:\Program Files\nodejs\node.exe' -ArgumentList 'engine-runner.mjs' -WorkingDirectory 'C:\signal-bot' -WindowStyle Hidden
}

if (-not $hasMonitor) {
    Add-Content 'C:\signal-bot\watchdog.log' "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Trade Monitor war tot - starte neu"
    Start-Process 'C:\Program Files\nodejs\node.exe' -ArgumentList 'trade-monitor.mjs' -WorkingDirectory 'C:\signal-bot' -WindowStyle Hidden
}
