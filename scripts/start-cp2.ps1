param([switch]$Setup)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$uv = Join-Path $root '.tools/bin/uv.exe'
if (-not (Test-Path $uv)) {
    $found = Get-Command uv -ErrorAction SilentlyContinue
    if (-not $found) { throw 'Install uv from https://docs.astral.sh/uv/getting-started/installation/ first.' }
    $uv = $found.Source
}
if ($Setup) {
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE) { throw 'pnpm install failed' }
    foreach ($service in @('api','stt','llm')) {
        & $uv sync --locked --directory "services/$service"
        if ($LASTEXITCODE) { throw "uv sync failed: $service" }
    }
}
& $uv run --directory services/api alembic upgrade head
if ($LASTEXITCODE) { throw 'Database migration failed' }
New-Item -ItemType Directory -Force evidence | Out-Null
$env:EVAL_MODE = '1'
$env:VITE_API_MOCK = '0'
$env:API_URL = 'http://127.0.0.1:8000'
$env:PYTHONUTF8 = '1'
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = '1'
$processes = @()
foreach ($port in @(5173,8000,8001,8002)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
        throw "Port $port is already in use. Stop the previous project server first."
    }
}
try {
    foreach ($service in @('api','stt','llm')) {
        $port = @{api=8000;stt=8001;llm=8002}[$service]
        $python = Join-Path $root "services/$service/.venv/Scripts/python.exe"
        $p = Start-Process $python -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port',"$port") -WorkingDirectory "$root/services/$service" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$root/evidence/$service.stdout.log" -RedirectStandardError "$root/evidence/$service.stderr.log"
        $processes += $p
    }
    $processes.Id | ConvertTo-Json | Set-Content evidence/server-pids.json
    Write-Host 'Group1 CP2: http://localhost:5173 (real API; synthetic data only). Ctrl+C stops this session.'
    pnpm --filter web dev --host 127.0.0.1
} finally {
    $processes | Where-Object { -not $_.HasExited } | Stop-Process
}
