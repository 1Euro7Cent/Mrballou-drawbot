const { execSync } = require('child_process')
const jsZip = require('jszip')
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

console.log('Build complete. files are found in dist/ \nPacking to zip file...')

let zip = new jsZip()

let files = zip.folder('')
for (let file of fs.readdirSync('./dist')) {
    if (fs.statSync(`./dist/${file}`).isFile()) {
        if (files != null)
            files.file(file, fs.readFileSync(`./dist/${file}`))
    }
}
console.log(zip)

zip.generateAsync({
    type: 'nodebuffer',
}).then((content) => {
    fs.writeFileSync('./build.zip', content)
    console.log('Packing complete. file is found in build.zip')

})