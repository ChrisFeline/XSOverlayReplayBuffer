@echo off
setlocal enabledelayedexpansion
mode con: cols=80 lines=15

set "registryKey=HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Valve\Steam"
set "valueName=InstallPath"

if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    echo This is a 32-bit system.
    set "registryKey=HKEY_LOCAL_MACHINE\SOFTWARE\Valve\Steam"
)

for /f "tokens=2*" %%a in ('reg query "%registryKey%" /v "%valueName%" ^| find "%valueName%"') do set "regValue=%%b"

set "potentialPath=%regValue%\steamapps\common\XSOverlay_Beta\"

rem Check if the target folder exists
if not exist "%potentialPath%" (
    echo =================================================
    echo Couldn't find XSOverlay install directory.
    echo Sorry :[
    echo =================================================
    echo.
    pause
    exit
)

echo =================================================
echo Potential Path:
echo   %potentialPath%
echo =================================================
echo.

set "potentialPathBridge=%potentialPath%XSOverlay_Data\StreamingAssets\Modules\Bridge\"
set "potentialPathNode=%potentialPathBridge%XSOverlay-Node-Server.exe"

set "patchFile=%~dp0\src\patch.js"

start /d "%potentialPathBridge%" "XSOverlay Node Patch" "%potentialPathNode%" "%patchFile%"