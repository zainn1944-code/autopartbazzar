param(
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$venvDir = Join-Path $backendDir "autopart_venv"
$pythonExe = Join-Path $venvDir "Scripts\\python.exe"

Write-Host "Project root: $root"

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCommand) {
    $pythonCommand = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $pythonCommand) {
    throw "Python is not installed or not available on PATH."
}

if (-not (Test-Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
}

if (-not (Test-Path $frontendDir) -and -not $SkipFrontend) {
    throw "Frontend folder not found: $frontendDir"
}

if (-not (Test-Path $venvDir)) {
    Write-Host "Creating backend virtual environment..."
    & $pythonCommand.Source -m venv $venvDir
} else {
    Write-Host "Using existing backend virtual environment..."
}

Write-Host "Installing backend Python requirements..."
& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install -r (Join-Path $backendDir "requirements.txt")

if (-not (Test-Path (Join-Path $backendDir ".env")) -and (Test-Path (Join-Path $backendDir ".env.example"))) {
    Copy-Item (Join-Path $backendDir ".env.example") (Join-Path $backendDir ".env")
    Write-Host "Created backend\\.env from backend\\.env.example"
}

if (-not $SkipFrontend) {
    Write-Host "Installing frontend npm dependencies..."
    npm.cmd --prefix $frontendDir install
}

Write-Host ""
Write-Host "Setup complete."
Write-Host "Backend venv: $venvDir"
Write-Host "Frontend folder: $frontendDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Set DATABASE_URL in backend\\.env to a running PostgreSQL database."
Write-Host "2. Run migrations: npm.cmd run migrate:backend"
Write-Host "3. Optional: set AWS_* for S3 uploads and EMAIL_* for password reset emails."
