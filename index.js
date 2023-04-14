const fs = require('fs')
const express = require('express')

const Config = require('./classes/config/Config')
const DrawManager = require('./classes/DrawManager')
const Setting = require('./classes/config/Setting')
const Positions = require('./classes/config/Positions')
const GuiConfig = require('./classes/config/GuiConfig')


let package = {} // DON'T CHANGE THIS LINE OTHERWISE THE BUILD WILL NOT SUCCEED

try {
    package = require('./package.json')
}
catch (e) {
    console.log("Couldn't get package.json.")
}

let config_ = new Config(undefined, true)
config_.fromFile('./config.json')
config_.save('./config.json')

let config = config_.data

if (config.debug.enabled) console.warn('Debug mode enabled')

// console.log(config)

if (fs.existsSync(config.temp + config.abortingFile)) {
    fs.unlinkSync(config.temp + config.abortingFile)
}

let drawManager = new DrawManager(config_)


// check if temp exists
if (!fs.existsSync(config.temp)) {
    fs.mkdirSync(config.temp)

}


let setting = new Setting(undefined, config.prettifyData)
setting.fromFile('./settings.json')
setting.save('./settings.json')
let settings = setting.data

let position = new Positions(undefined, config.prettifyData)
position.fromFile('./positions.json')
position.save('./positions.json')

let guiConfig = new GuiConfig(undefined, config.prettifyData)
guiConfig.fromFile('./guiConfig.json')
guiConfig.save('./guiConfig.json')


let app = express()

app.post('/draw', async (req, res) => {
    res.send()
    // delete aborting file
    if (fs.existsSync(config.temp + config.abortingFile)) {
        fs.unlinkSync(config.temp + config.abortingFile)
    }
    console.log('got draw request')
    setting.fromFile('./settings.json')
    setting.data.ignoreColors = ['#ffffff'] // for test purposes. will be removed later
    // setting.data.ignoreColors = [] // for test purposes. will be removed later
    setting.save('./settings.json')
    position.fromFile('./positions.json')
    position.save('./positions.json')


    await drawManager.startDraw(setting, position)
    drawManager.state = "idle"
})

app.get("/version", (req, res) => {
    console.log("got version request")
    res.send(package.version)
})

app.get("/guiName", (req, res) => {
    console.log("got guiName request")
    res.send(package.name)
})

app.get("/state", (req, res) => {
    res.send(drawManager.state)
})


app.listen(config.port, () => {
    console.log(`listening on port ${config.port}`)
})
// console.log(positions)


