const { execSync, exec } = require('child_process')
const jsZip = require('jszip')
const fs = require('fs')

const package = require('./package.json')

console.time('build')
// make sure we have pkg installed

try {
    execSync('pkg --version')
} catch (e) {
    console.log('pkg not installed. installing...')
    execSync('npm install -g pkg')
}

// make sure we have pyinstaller installed

try {
    execSync('pyinstaller --version')
} catch (e) {
    console.log('pyinstaller not installed. installing...')
    execSync('pip install pyinstaller')
}

// make sure we have customtkinter installed

let cTkinterLocation = ''

let res = ""
let tries = 0
do {
    try {
        tries++
        res = execSync('pip show customtkinter').toString()
    } catch (e) {
        console.log("customtkinter not installed. installing...")
        execSync('pip install customtkinter')
    }
}
while (res == "" || tries > 2)

if (res == "" || tries > 2) {
    console.log("Couldn't install customtkinter / get the path. Aborting...")
    process.exit(1)
}

res.split("\n").forEach(line => {
    // console.log("line:", line)
    if (line.startsWith('Location:')) {
        cTkinterLocation = line.split('Location:')[1].trim()
        return
    }
})

cTkinterLocation += "/customtkinter;customtkinter/"
console.log(cTkinterLocation)


// clean up

console.log('Cleaning up...')

let cleanupFiles = [
    'dist',
    'build.zip',
    // "temp",
    // "build"
]
    .concat(
        fs.readdirSync("./").filter(f => f.endsWith('.spec'))
    )
console.log(cleanupFiles)
for (let file of cleanupFiles) {
    if (fs.existsSync(file)) {
        console.log(`Deleting ${file}`)
        fs.rmSync(file, { recursive: true })
    }

}

const commands = [
    "pkg index.temp.js -o ./dist/drawbot.exe",
    `pyinstaller --workpath "./temp" --onefile initializePositions.py`,
    `pyinstaller --workpath "./temp" --onefile gui.py --add-data \"${cTkinterLocation}\"`
]

console.log(commands)
// return

if (!fs.existsSync('build')) fs.mkdirSync('build')

// insert version number into script

let script = fs.readFileSync('index.js', 'utf8')
let replaceWith = `let package = {`

for (let key in package) {
    if (typeof package[key] != "number" && typeof package[key] != "string") continue
    let isStr = typeof package[key] == 'string'
    replaceWith += `
    ${key}: ${isStr ? `"` : ""}${package[key]}${isStr ? `"` : ""},`
}

replaceWith += "}"

script = script.replace('let package = {}', replaceWith)

fs.writeFileSync('index.temp.js', script)
// return
for (let command of commands) {
    console.log(`Executing: ${command}`)
    execSync(command)
}
fs.rmSync('index.temp.js')

console.log('Build complete. files are found in dist/ \nPacking to zip file...')

let startBatch = `@echo off
start cmd /k "drawbot.exe"
echo Waiting for drawbot to start...
timeout /t 3
start cmd /k "gui.exe"
`

fs.writeFileSync('dist/start.bat', startBatch)

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

console.timeEnd('build')