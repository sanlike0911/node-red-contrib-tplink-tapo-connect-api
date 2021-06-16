@echo off
cd /d %~dp0

rem build and install
npm run build & ^
xcopy /Y /S /E src\locales\ nodes\locales\ & ^
copy /Y src\*.html nodes\ & ^
xcopy /Y /S /E dist\* nodes\* & ^
md data\your-node\nodes\ & ^
copy /Y package.json data\your-node\ & ^
xcopy /Y /S /E nodes\* data\your-node\nodes\* & ^
cd data/ & ^
npm install .\your-node & ^
cd .. & ^
npm run start