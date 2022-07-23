const BaseConfig = require("./BaseConfig")

module.exports = class Config extends BaseConfig {
    constructor(name = 'config', prettify = false) {
        super(name, prettify)

        this.data = {
            temp: './temp/',
            abortingFile: "aborting.json",
            port: 25600,
            prettifyData: false,
            abortKey: 'q',
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