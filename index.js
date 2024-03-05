const fs = require('fs')
const ws = require('ws')
// const axios = require('axios')
// const axios = require(process.execPath + '/node_modules/axios')
// let axios

// import(process.cwd() + '/node_modules/axios').then((module) => {
//     axios = module.default
// }).catch((error) => {
//     console.error("Failed to import axios:", error)
// })

// import "axios"
const https = require('https')

const Config = require('./classes/config/Config')
const DrawManager = require('./classes/DrawManager')
const Setting = require('./classes/config/Setting')
const Positions = require('./classes/config/Positions')
const GuiBuilder = require('./classes/gui/GuiBuilder')


let package = {} // DON'T CHANGE THIS LINE OTHERWISE THE BUILD WILL NOT SUCCEED

let versions = {
    latest: "unknown",  // latest version
    latestStable: "unknown", // latest stable version. latest version not marked as pre-release
}
let isCheckingForUpdates = false
let updateCheckFailed = false
let isUpdateAvailable = {
    latest: false,
    latestStable: false
}
let tellGui

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

if (config.checkForUpdates) {
    console.log('checking for updates')
    isCheckingForUpdates = true
    let resData = ""
    https.get('https://api.github.com/repos/1Euro7Cent/Mrballou-drawbot/releases', {
        headers: {
            'User-Agent': 'Mrballou-drawbot'
        }

    })
        .on('response', (res) => {
            res.on('data', (data) => {
                resData += data
            })
            res.on('end', () => {
                if (resData.startsWith("[") || resData.startsWith("{")) {
                    res = {
                        data: JSON.parse(resData)
                    }
                }
                // console.log('got response: ' + resData)
                let latest = res.data[0]
                let latestStable = res.data.find((release) => !release.prerelease)
                versions.latest = latest.tag_name
                versions.latestStable = latestStable.tag_name
                isCheckingForUpdates = false
                isUpdateAvailable.latest = latest.tag_name != package.version
                isUpdateAvailable.latestStable = latestStable.tag_name != package.version
                console.log(`latest version: ${versions.latest} ${isUpdateAvailable.latest ? "update available" : "no update available"}`)
                console.log(`latest stable version: ${versions.latestStable} ${isUpdateAvailable.latestStable ? "update available" : "no update available"}`)
                tellGuiUpdateInfos()

            })
        })
    /*
        .then((res) => {
            let latest = res.data[0]
            let latestStable = res.data.find((release) => !release.prerelease)
            versions.latest = latest.tag_name
            versions.latestStable = latestStable.tag_name
            isCheckingForUpdates = false
            isUpdateAvailable.latest = latest.tag_name != package.version
            isUpdateAvailable.latestStable = latestStable.tag_name != package.version
            console.log(`latest version: ${versions.latest} ${isUpdateAvailable.latest ? "update available" : "no update available"}`)
            console.log(`latest stable version: ${versions.latestStable} ${isUpdateAvailable.latestStable ? "update available" : "no update available"}`)
            tellGuiUpdateInfos()
        })
        .catch((e) => {
            console.error(e)
            isCheckingForUpdates = false
            updateCheckFailed = true
            tellGuiUpdateInfos()
        })
        //*/

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
    if (config.communication.allowOnlyOneConnection && connected) {
        console.log('already connected')
        ws.send('already connected')
        ws.close()
        return
    }
    let guiBuilder = new GuiBuilder(package, ws, config_, saves)
    guiBuilder.checkForUpdates = config.checkForUpdates
    guiBuilder.isCheckingForUpdates = isCheckingForUpdates
    guiBuilder.updateCheckFailed = updateCheckFailed
    tellGui = guiBuilder
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

    ws.on('message', async (msg) => {
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
                            break
                        case 'ignoreColorsButton':
                            guiBuilder.buildColorSelector(setting, position).serve()

                            // let mainCs = await guiBuilder.buildColorSelector(setting, position, true)
                            // mainCs.serve()
                            break

                        case "addIgnoreColor":
                            let color = await guiBuilder.requestColor()
                            console.log(`got color: ${color}`)
                            if (!color) {
                                // await sleep(1000)
                                guiBuilder.buildColorSelector(setting, position, "In your last operation something has gone wrong").serve()
                                // let cs1 = await guiBuilder.buildColorSelector(setting, position, true, "In your last operation something has gone wrong")
                                // cs1.serve()
                                break
                            }

                            if (setting.data.ignoreColors[color]) {
                                // await sleep(1000)
                                guiBuilder.buildColorSelector(setting, position, `The color ${color} already exists`).serve()
                                // let cs2 = await guiBuilder.buildColorSelector(setting, position, true, "The color already exists")
                                // cs2.serve()
                                break
                            }
                            console.log(`adding color: ${color} to ignoreColors`)

                            setting.data.ignoreColors[color] = {}
                            setting.save('./settings.json')
                            // await sleep(1000)
                            guiBuilder.buildColorSelector(setting, position).serve()
                            // let cs3 = await guiBuilder.buildColorSelector(setting, position, true)
                            // cs3.serve()
                            break
                        case "removeIgnoreColor":
                            let toRemoveColor = data.data.removeSelectedColor
                            // console.log(`removing color: ${toRemoveColor} from ignoreColors`)
                            if (!toRemoveColor) {
                                guiBuilder.buildColorSelector(setting, position, "You need to select a color to remove").serve()
                                break
                            }
                            delete setting.data.ignoreColors[toRemoveColor]
                            setting.save('./settings.json')
                            guiBuilder.buildColorSelector(setting, position).serve()
                        // let col = await guiBuilder.requestColor(10 * 1000)
                        // console.log(`got color from promise: ${col}`)
                    }
                    break
                case "color":
                    // console.log(`got color: ${data.data}`)
                    guiBuilder.gotReqCol(data.data)
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
    // setting.data.ignoreColors = ['#ffffff']
    setting.save('./settings.json')
    settings = setting.data
}


let tellClock
function tellGuiUpdateInfos() {
    function setData() {
        tellGui.checkForUpdates = config.checkForUpdates
        tellGui.isCheckingForUpdates = isCheckingForUpdates
        tellGui.updateCheckFailed = updateCheckFailed
        tellGui.checkForUpdatesPreRelease = config.checkForUpdatesPreRelease
        tellGui.isUpdateAvailable = config.checkForUpdatesPreRelease ? isUpdateAvailable.latest : isUpdateAvailable.latestStable
        tellGui.latestVersion = config.checkForUpdatesPreRelease ? versions.latest : versions.latestStable
        clearInterval(tellClock)
        return
    }

    if (tellGui instanceof GuiBuilder) {
        setData()
    }
    else {
        tellClock = setInterval(() => {
            if (tellGui instanceof GuiBuilder) {
                setData()
            }
        }, 100)
    }

}
