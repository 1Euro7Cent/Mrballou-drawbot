const { execSync } = require('child_process')
const fs = require('fs')

const commands = [
    "pkg index.js -o ./dist/drawbot.exe",
    "pyinstaller --onefile gui.py",
    "pyinstaller --onefile initializePositions.py"
]

for (let command of commands) {
    console.log(`Executing: ${command}`)
    execSync(command)
}

let packageJson = fs.readFileSync('package.json', 'utf8')
fs.writeFileSync('dist/package.json', packageJson)

console.log('Build complete. files are found in dist/')