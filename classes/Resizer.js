const Config = require('./config/Config')
const Jimp = require('jimp')
const resizer = require("imagemaxsize")

module.exports = class Resizer {
    /**
     * @param {Config} config
     */
    constructor(config) {
        this.config = config.data
    }

    /**
     * this resizes the image to NOT loose the aspect ratio and the image CANNOT be any larger then the given size on the width or height
     * @param {Jimp} img
     * @param {{w:number, h:number}} size
     */
    async resize(img, size) {

        let nsize = resizer.resize(img.bitmap.width, img.bitmap.height, size.w, size.h, {
            resizeType: "fast", // exact, fast

        }) // { width: 979, height: 1080, timeTook: 6, steps: 856 }

        console.log(nsize)

        return img.resize(nsize.width, nsize.height)

    }
}