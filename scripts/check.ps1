$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$uv = Join-Path (Get-Location) '.tools/bin/uv.exe'
if (-not (Test-Path $uv)) { $uv = (Get-Command uv).Source }
New-Item -ItemType Directory -Force evidence | Out-Null
$checks = @()
foreach ($command in @('lint','typecheck','test','build')) {
    & pnpm $command 2>&1 | Tee-Object "evidence/web-$command.log"
    $checks += @{name="web-$command";exit=$LASTEXITCODE}
}
foreach ($service in @('api','stt','llm')) {
    & $uv run --directory "services/$service" ruff check . 2>&1 | Tee-Object "evidence/$service-lint.log"
    $checks += @{name="$service-lint";exit=$LASTEXITCODE}
    & $uv run --directory "services/$service" pytest -q 2>&1 | Tee-Object "evidence/$service-tests.log"
    $checks += @{name="$service-tests";exit=$LASTEXITCODE}
}
& services/api/.venv/Scripts/python.exe -m pytest eval -q 2>&1 | Tee-Object evidence/metrics-tests.log
$checks += @{name='metrics';exit=$LASTEXITCODE}
$checks | ConvertTo-Json | Set-Content evidence/checks.json
if ($checks | Where-Object { $_.exit -ne 0 }) { throw 'One or more checks failed. See evidence/checks.json.' }
