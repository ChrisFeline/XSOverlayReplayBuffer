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

echo =================================================
set "potentialPath=%regValue%\steamapps\common\XSOverlay_Beta\"
set "potentialPathJson=%potentialPath%XSOverlay_Data\StreamingAssets\Plugins\UserInterface\settings.obs.json"
echo Potential Path:
echo   %potentialPath%
echo =================================================
echo.

echo =================================================
echo Enter OBS WebSocket Port. (Press enter to skip)
echo =================================================
set /p socketPort=Port: 
echo.
if not defined socketPort set "socketPort=4455"

echo =================================================
echo Enter OBS WebSocket password. (Can be empty if Authentication is disabled)
echo Tools ^> WebSocket Server Settings ^> Show Connect Info ^> Server Password
echo =================================================
set /p socketPass=Password: 
echo.

echo =================================================
set "modDir=%~dp0\mod\*"
xcopy "%modDir%" "%potentialPath%" /E /Y
echo =================================================
echo Generating Settings: 'settings.obs.json'
echo {"port":%socketPort%,"password":"%socketPass%"} > "%potentialPathJson%"
echo =================================================
echo.

echo =================================================
echo Mod has copied to XSOverlay directory.
echo Start XSOverlay and check your media buttons.
echo =================================================
echo.

pause