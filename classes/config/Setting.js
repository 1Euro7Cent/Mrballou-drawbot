const BaseConfig = require("./BaseConfig")


module.exports = class Setting extends BaseConfig {
    constructor(name = 'setting', prettify = false, allowParseToNumber = true, ignoreArray = false) {
        super(name, prettify, allowParseToNumber, ignoreArray)

        this.data = {
            platform: "paint",
            img: './img/test.png',
            dither: false,
            fast: true,
            sortColors: true,
            distancing: 1,
            delay: 1,
            colorDelay: 0,
            moveDelay: 0,
            ignoreColors: {

            },
            transparentColor: "#ffffff",
            sortColAlg: "size 0-9",
            resizeImgAlg: "fit",
            positionImgAlg: "center",
            bucket: false,
            lineSaving: false,
            onTimeDelay: false,
            onTimeDelayMultiplier: 1,
            positionOverride: {
                enabled: false,
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            },
            dualColorMode: false,
            onePassMode: false,
            box: false,
        }

    }

}