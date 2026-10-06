# F1TV-HUD Recorder Script
# Records the game's UDP telemetry to the recordings\ folder, using the standalone
# Node.js runtime installed by install.ps1. Asks for the port, an optional recording
# name and whether to forward the data to the overlays (each question falls back to
# its default after a few seconds, so recording still starts if nobody answers).
#
# TIP: To run this without opening a terminal, double-click record.bat instead.

$RUNTIME_DIR = Join-Path $PSScriptRoot "runtime"
$NodeExe     = Join-Path $RUNTIME_DIR "node.exe"

# -- Check runtime is present -------------------------------------------------
if (-not (Test-Path $NodeExe)) {
    Write-Host "Node.js runtime not found. Please run install.ps1 first."
    Write-Host ""
    Write-Host "  Right-click install.ps1 and choose 'Run with PowerShell'"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Same as run.ps1 - lets bare "node" lookups resolve to the bundled runtime
$env:PATH = "$RUNTIME_DIR;$env:PATH"

# -- Start the recorder --------------------------------------------------------
& $NodeExe (Join-Path $PSScriptRoot "recorder.js") --interactive
