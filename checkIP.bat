@echo off
REM Check everything about an IP address
REM - Where does it appear in a Security lists
REM - Where does it appear in a Routing table
REM 
REM Usage: checkIP.bat <IP address>

if "%~1"=="" (
    echo Error: No argument provided. Please provide an IP address.
    exit /b 1
)

node --no-warnings getSLs ip=%1
node --no-warnings getRouting ip=%1
