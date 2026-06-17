# F1TV-HUD Install Script
# Downloads a standalone Node.js binary and installs/updates project dependencies.
# Safe to re-run any time (e.g. after a `git pull`) to pick up new dependencies
# or patches (via patch-package) without re-downloading Node.js.
#
# TIP: To run this without opening a terminal, double-click install.bat instead.

$NODE_VERSION = "24.16.0"
$NODE_ZIP_URL = "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-win-x64.zip"
$RUNTIME_DIR  = Join-Path $PSScriptRoot "runtime"
$ZIP_PATH     = Join-Path $PSScriptRoot "runtime-node.zip"

# ── 1. Skip download if runtime is already set up ────────────────────────────
$RuntimeReady = $false
if (Test-Path (Join-Path $RUNTIME_DIR "node.exe")) {
    $existing = & "$RUNTIME_DIR\node.exe" --version 2>$null
    if ($existing -eq "v$NODE_VERSION") {
        Write-Host "Node.js v$NODE_VERSION already installed in runtime\. Skipping download."
        $RuntimeReady = $true
    } else {
        Write-Host "Different Node version found ($existing). Re-installing v$NODE_VERSION..."
        Remove-Item $RUNTIME_DIR -Recurse -Force
    }
}

if (-not $RuntimeReady) {
    # ── 2. Download Node.js zip ───────────────────────────────────────────────
    Write-Host "Downloading Node.js v$NODE_VERSION..."
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $NODE_ZIP_URL -OutFile $ZIP_PATH -UseBasicParsing

    # ── 3. Extract and flatten into runtime\ ──────────────────────────────────
    Write-Host "Extracting..."
    $TempExtract = Join-Path $PSScriptRoot "runtime-temp"
    Expand-Archive -Path $ZIP_PATH -DestinationPath $TempExtract -Force

    # The zip contains a single versioned subfolder (node-v24.x.x-win-x64\) — move it to runtime\
    $Extracted = Get-ChildItem $TempExtract -Directory | Select-Object -First 1
    Move-Item $Extracted.FullName $RUNTIME_DIR

    # Clean up
    Remove-Item $ZIP_PATH -Force
    Remove-Item $TempExtract -Force
}

# ── 4. Install/update project dependencies ───────────────────────────────────
# This also re-applies any patches via the postinstall patch-package hook,
# so re-running this script is the way for existing users to pick those up.
Write-Host "Installing dependencies..."
$NodeExe = Join-Path $RUNTIME_DIR "node.exe"
$NpmScript = Join-Path $RUNTIME_DIR "node_modules\npm\bin\npm-cli.js"

& $NodeExe $NpmScript install --prefix $PSScriptRoot $PSScriptRoot
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed."
    exit 1
}

Write-Host ""
Write-Host "Setup complete. Run run.ps1 to start the application."
