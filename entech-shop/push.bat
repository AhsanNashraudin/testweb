@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === ENTECH: upload changes to GitHub (Vercel deploys automatically) ===
git add -A
git commit -m "Update website (hero scene v3 and latest edits)"
git push
echo.
if %errorlevel%==0 (echo Done. Vercel will deploy in 1-2 minutes.) else (echo Push failed - please send a screenshot of this window.)
pause
