@echo off
cd /d "%~dp0"

echo.
echo ==============================
echo       Git Update
echo ==============================
echo.

git add .

git commit -m "Update project"

git push

echo.
echo ==============================
echo       Done!
echo ==============================
pause