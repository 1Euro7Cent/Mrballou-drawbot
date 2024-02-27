const BaseConfig = require("./BaseConfig")

module.exports = class Config extends BaseConfig {
    constructor(name = 'config', prettify = false) {
        super(name, prettify)

        this.data = {
            checkForUpdates: true,
            checkForUpdatesPreRelease: false, // if true, it will check for pre-releases
            temp: './temp/',
            abortingFile: "aborting.json",
            port: 25600,
            prettifyData: false,
            abortKey: 'q',
            progressBar: {
                enabled: true,
                head: '>',
                complete: '=',
                incomplete: ' ',
                renderThrottle: 100 // 100 ms until next render
            },
            guiProgressBar: {
                availableSpace: 15,
            },
            gui: {
                font: "Consolas",
                fontSize: 12,
                geometry: {
                    width: -1,
                    height: -1,
                    x: -1,
                    y: -1
                }

            },
            communication: {
                allowOnlyOneConnection: true,
                keepAlive: {
                    interval: 1000,
                    messageSender: "ping",
                    messageReceiver: "pong",
                    unreceivedMax: 5,

                }
            },
            debug: {
                enabled: false,
                saveWrite: {
                    enabled: false,
                    colors: {
                        visited: '#00ff0080',
                        custom: '#ff000080',
                        instruction: '#0000ff80'
                    }
                }
            }

        }

    }
}