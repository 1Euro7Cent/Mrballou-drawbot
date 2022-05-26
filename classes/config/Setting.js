const BaseConfig = require("./BaseConfig")


module.exports = class Setting extends BaseConfig {
    constructor(name = 'setting', prettify = false) {
        super(name, prettify)

        this.data = {
            name: "paint",
            img: './img/test.png',
            dither: false,
            fast: true,
            distancing: 1,
            delay: 1,
            colorDelay: 0,
            ignoreColors: ['#ffffff'],
        }

    }

}