@echo off
rem Drag a .jsonl recording onto this file to play it without picking from the list.
powershell -ExecutionPolicy Bypass -File "%~dp0play.ps1" %*
pause
