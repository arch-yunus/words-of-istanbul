@echo off
echo [WORDS OF ISTANBUL - MUHURLEME ISLEMI BASLIYOR...]

:: 1. Banner'ı taşı
echo [1/2] Banner gorseli tasiyor...
copy "C:\Users\bahat\.gemini\antigravity\brain\b50fb18e-e996-44db-b75a-2162dec880c7\istanbul_soul_banner_png_1775987950120.png" "assets\istanbul_soul_banner.png"

:: 2. Git islemleri
echo [2/2] GitHub senkronizasyonu yapiliyor...
git add .
git commit -m "feat: full repository reconstruction v6.0-RESURRECTION (NFK Pivot)"
git push origin main

echo.
echo [ISLEM TAMAMLANDI!]
echo Istanbul'un ruhu artik GitHub'da.
pause
