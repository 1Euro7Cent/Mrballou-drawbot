const BaseConfig = require("./BaseConfig")

module.exports = class Config extends BaseConfig {
    constructor(name = 'config', prettify = false) {
        super(name, prettify)

        this.data = {
            temp: './temp/',
            abortingFile: "aborting.json",
            port: 25600,
            prettifyData: false,
            abortKey: 'q'
        }

    }
}