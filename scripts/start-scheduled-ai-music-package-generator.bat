@echo off
setlocal

set "N8N_USER_FOLDER=C:\Users\Admin\.n8n-scheduled-ai-music"

if not exist "%N8N_USER_FOLDER%" mkdir "%N8N_USER_FOLDER%"
if not exist "D:\AI_Music_Output" mkdir "D:\AI_Music_Output"

if exist "%N8N_USER_FOLDER%\.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%N8N_USER_FOLDER%\.env") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

set "N8N_PORT=5682"
set "N8N_PROTOCOL=http"
set "N8N_HOST=localhost"
set "N8N_RUNNERS_BROKER_PORT=5683"
set "GENERIC_TIMEZONE=Asia/Dubai"
set "TZ=Asia/Dubai"
set "NODE_FUNCTION_ALLOW_BUILTIN=fs,path,crypto"

echo Starting isolated n8n for Scheduled AI Music Package Generator...
echo URL: http://localhost:%N8N_PORT%
echo Task broker port: %N8N_RUNNERS_BROKER_PORT%
echo User folder: %N8N_USER_FOLDER%
echo.
echo Secrets file: %N8N_USER_FOLDER%\.env
echo Paste your real keys into that file before running a live workflow.
echo.

node C:\Users\Admin\AppData\Roaming\npm\node_modules\n8n\bin\n8n start

endlocal
