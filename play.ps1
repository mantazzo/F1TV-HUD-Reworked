# F1TV-HUD Player Script
# Plays back a recording from the recordings\ folder, using the standalone Node.js
# runtime installed by install.ps1. Shows a numbered list of recordings to pick from,
# then asks for the port, speed and looping (Enter accepts each default).
#
# A recording path passed as the first argument (e.g. a file dropped onto play.bat)
# skips the list and goes straight to the other questions.
#
# TIP: To run this without opening a terminal, double-click play.bat instead.

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

# -- Start the player ----------------------------------------------------------
$PlayerArgs = @((Join-Path $PSScriptRoot "player.js"))
if ($args.Count -gt 0 -and $args[0]) { $PlayerArgs += $args[0] }
$PlayerArgs += "--interactive"
& $NodeExe @PlayerArgs
