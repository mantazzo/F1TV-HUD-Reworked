# F1TV-HUD Run Script
# Starts the application using the standalone Node.js runtime installed by install.ps1.
#
# TIP: To run this without opening a terminal, double-click run.bat instead.

$RUNTIME_DIR = Join-Path $PSScriptRoot "runtime"
$NodeExe     = Join-Path $RUNTIME_DIR "node.exe"

# ── Check runtime is present ──────────────────────────────────────────────────
if (-not (Test-Path $NodeExe)) {
    Write-Host "Node.js runtime not found. Please run install.ps1 first."
    Write-Host ""
    Write-Host "  Right-click install.ps1 and choose 'Run with PowerShell'"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# ── Start the application ────────────────────────────────────────────────────
& $NodeExe (Join-Path $PSScriptRoot "index.js")
