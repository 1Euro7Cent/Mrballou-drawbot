const fs = require('fs')
const express = require('express')
const ws = require('ws')

const Config = require('./classes/config/Config')
const DrawManager = require('./classes/DrawManager')
const Setting = require('./classes/config/Setting')
const Positions = require('./classes/config/Positions')
const GuiConfig = require('./classes/config/GuiConfig')
const GuiBuilder = require('./classes/gui/GuiBuilder')


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



// check if temp exists
if (!fs.existsSync(config.temp)) {
    fs.mkdirSync(config.temp)

}


//*
let setting = new Setting(undefined, config.prettifyData)
setting.fromFile('./settings.json')
setting.save('./settings.json')
let settings = setting.data
//*/

// @ts-ignore
settings = {}

let position = new Positions(undefined, config.prettifyData)
position.fromFile('./positions.json')
position.save('./positions.json')

let guiConfig = new GuiConfig(undefined, config.prettifyData)
guiConfig.fromFile('./guiConfig.json')
guiConfig.save('./guiConfig.json')

if (!fs.existsSync('./saves.json')) {
    fs.writeFileSync('./saves.json', "{}")
}

let saves = require('./saves.json')


console.log(`starting websocket server on port ${config.port}`)

const wss = new ws.Server({ port: config.port })
let connected = false

wss.on('connection', (ws) => {
    // console.log(ws)
    console.log('connection established')
    if (connected) {
        console.log('already connected')
        ws.send('already connected')
        ws.close()
        return
    }
    let guiBuilder = new GuiBuilder(package, ws, config_, saves)
    connected = true
    let drawManager = new DrawManager(config_, guiBuilder)

    guiBuilder.buildSelection(setting, position).serve()
    // console.log(guiBuilder.toStr(selectGui))

    let messageCount = config.communication.keepAlive.unreceivedMax
    let c = 0

    let heartbeat = setInterval(() => {
        ws.send(config.communication.keepAlive.messageSender)
        // console.log(`keep alive count: ${messageCount}`)
        /*
        c++
        if (c % 5 == 0) {
            if (c % 10 == 0) {
                let selectGui = guiBuilder.buildSelection(config)
                ws.send(guiBuilder.toStr(selectGui))
            }
            else {
                let testGui = guiBuilder.buildTest(config)
                ws.send(guiBuilder.toStr(testGui))
            }
        }
        //*/
        messageCount--
        if (messageCount < 0) {
            console.log('client disconnected')
            connected = false
            drawManager.abort()
            ws.close()
            console.log(ws.readyState == ws.CLOSED ? 'closed' : 'not closed')
            clearInterval(heartbeat)
        }
        // console.log('pinging client')
    }, config.communication.keepAlive.interval)

    ws.on('message', (msg) => {
        let message = msg.toString()
        if (message == config.communication.keepAlive.messageReceiver) {
            messageCount++
            return
        }

        if (message == config.abortKey || message.toLowerCase() == "stop") {
            // console.log("aborting draw request")
            drawManager.abort()
            return
        }

        let data = JSON.parse(message)
        if (data) {
            switch (data.type) {
                case "buttonPressed":
                    console.log(`button "${data.button}" pressed`)
                    switch (data.button) {
                        case 'drawButton':
                            if (fs.existsSync(config.temp + config.abortingFile)) {
                                fs.unlinkSync(config.temp + config.abortingFile)
                            }
                            loadAndSetData(data)

                            position.fromFile('./positions.json')
                            position.save('./positions.json')
                            drawManager.startDraw(setting, position)
                            break
                        case 'abortButton':
                            drawManager.abort()
                            guiBuilder.buildSelection(setting, position).serve()
                            break
                        case 'saveConfig':
                            loadAndSetData(data)
                            // console.log(data)

                            saves[data.data.saveConfigName] = setting.data
                            fs.writeFileSync('./saves.json', JSON.stringify(saves, null, config.prettifyData ? 2 : undefined))
                            guiBuilder.buildSelection(setting, position).serve()
                            break
                        case 'loadConfig':
                            if (data.data.loadConfigName == "") {
                                guiBuilder.buildMessage("You need to select a name").serve()
                                break
                            }
                            if (!saves[data.data.loadConfigName]) {
                                guiBuilder.buildMessage("This name doesn't exist").serve()
                                break
                            }

                            // to make it compatible with 1.12 saves:
                            if (saves[data.data.loadConfigName].name && !saves[data.data.loadConfigName].platform) {
                                saves[data.data.loadConfigName].platform = saves[data.data.loadConfigName].name
                                delete saves[data.data.loadConfigName].name
                            }

                            setting.fromJson(saves[data.data.loadConfigName])
                            setting.save('./settings.json')

                            fs.writeFileSync('./saves.json', JSON.stringify(saves, null, config.prettifyData ? 2 : undefined))

                            guiBuilder.buildSelection(setting, position).serve()

                    }
                    break
                default:
                    console.log(`got unknown type: ${message}`)
                    break
            }
            return
        }

        console.log(`got message: ${message}`)

    })
})
function loadAndSetData(data) {
    setting.fromJson(data.data)
    setting.data.ignoreColors = ['#ffffff']
    setting.save('./settings.json')
    settings = setting.data
}



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

/*
app.listen(config.port, () => {
    console.log(`listening on port ${config.port}`)
})
//*/
// console.log(positions)


