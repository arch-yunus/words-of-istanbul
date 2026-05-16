@echo off
chcp 65001 >nul
echo [WORDS OF ISTANBUL - MUHURLE v6]

cd /d "%~dp0"

echo [1/3] Matrix yeniden uretiliyor...
python scripts\build_matrix.py
if errorlevel 1 goto :fail

echo [2/3] Dogrulama...
python src\ruh.py --validate
if errorlevel 1 goto :fail

echo [3/3] Git push...
git add -A
git commit -m "feat: v6 corpus sync and matrix rebuild"
git push origin main
if errorlevel 1 goto :fail

echo.
echo [TAMAMLANDI] Istanbul'un ruhu senkron.
pause
exit /b 0

:fail
echo [HATA] Islem basarisiz.
pause
exit /b 1
