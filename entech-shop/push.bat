@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === ENTECH: upload changes to GitHub (Vercel deploys automatically) ===
git add -A -- . ":(exclude)testweb"
git commit -m "ENTECH demo: LINE sales notify, quote assignment, ISO popup, phones, backup, Hostatom build"
git pull --rebase --autostash
git push
echo.
if %errorlevel%==0 (echo Done. Vercel will deploy in 2-3 minutes.) else (echo Push failed - please send a screenshot of this window.)
pause
