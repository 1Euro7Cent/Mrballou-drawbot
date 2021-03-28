@echo off

echo "WARNING! this file will open 2 new consoles after pressing any key"
pause
start cmd /c "node ./server/index.js"
start cmd /c "python gui.py"