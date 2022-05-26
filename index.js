const fs = require('fs')
const express = require('express')

const Config = require('./classes/config/Config')
const DrawManager = require('./classes/DrawManager')
const Setting = require('./classes/config/Setting')
const Positions = require('./classes/config/Positions')

let config_ = new Config(undefined, true)
config_.fromFile('./config.json')
config_.save('./config.json')

let config = config_.data

// console.log(config)

if (fs.existsSync(config.temp + config.abortingFile)) {
    fs.unlinkSync(config.temp + config.abortingFile)
}

let drawManager = new DrawManager(config_)


// check if temp exists
if (!fs.existsSync(config.temp)) {
    fs.mkdirSync(config.temp)

}

//todo: add gui to make these settings
let setting = new Setting(undefined, config.prettifyData)
setting.fromFile('./settings.json')
setting.save('./settings.json')
let settings = setting.data

let position = new Positions(undefined, config.prettifyData)
position.fromFile('./positions.json')
position.save('./positions.json')


let app = express()

app.post('/draw', (req, res) => {
    res.send()
    // delete aborting file
    if (fs.existsSync(config.temp + config.abortingFile)) {
        fs.unlinkSync(config.temp + config.abortingFile)
    }
    console.log('got draw request')
    setting.fromFile('./settings.json')
    setting.save('./settings.json')
    position.fromFile('./positions.json')
    position.save('./positions.json')


    drawManager.startDraw(setting, position)
})

app.listen(config.port, () => {
    console.log(`listening on port ${config.port}`)
})
// console.log(positions)


