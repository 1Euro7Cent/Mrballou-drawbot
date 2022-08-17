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
     * @param {"fit" | "stretch" | "cropX" | "cropY" | "none"} alg
     */
    async resize(img, size, alg) {
        let nSize = {
            w: -1,
            h: -1
        }
        switch (alg) {
            case 'fit':
                nSize = resizer.resize(img.bitmap.width, img.bitmap.height, size.w, size.h, {
                    resizeType: "fast", // exact, fast

                }) // { width: 979, height: 1080, timeTook: 6, steps: 856 }
                return img.resize(nSize.width, nSize.height)
            case 'stretch':
                nSize = size
                return img.resize(nSize.w, nSize.h)
            case 'cropX':
                return img.resize(Jimp.AUTO, size.h)
            case 'cropY':
                return img.resize(size.w, Jimp.AUTO)
            case 'none':
                return img
            default:
                throw new Error("Unknown resize algorithm: " + alg)



        }
    }
}