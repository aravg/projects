@echo off
echo Starting CCRTS Application...
echo.
echo Starting Backend (FastAPI)...
start cmd /k "cd /d %~dp0backend && python -m pip install -r requirements.txt && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3
echo Starting Frontend (React)...
start cmd /k "cd /d %~dp0frontend && npm install && npm run dev"
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
pause
