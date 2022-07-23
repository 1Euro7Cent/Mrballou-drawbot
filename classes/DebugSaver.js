const Jimp = require("jimp/")
const Config = require("./config/Config")
const fs = require("fs")

module.exports = class DebugSaver {
    /**
    * @param {Config} config
    */
    constructor(config) {
        this.config = config.data
        /**
         * @type {string[]}
         */
        this.drawnPixels = []

        /**
         * @type {string[]}
         */
        this.instructionPixels = []

        /**
         * @type {Jimp | null}
         */
        this.srCImage = null
    }

    /**
     * 
     * @param {string[] | string | undefined} custom 
     */
    async makeImage(custom = undefined) {
        if (typeof custom == "string") custom = [custom]
        if (this.srCImage != null) {
            let tempImage = this.srCImage.clone()

            let imageOverlay = new Jimp(tempImage.bitmap.width, tempImage.bitmap.height)

            let visitedRGBA = hexToRGBA(this.config.debug.saveWrite.colors.visited)
            let visitedColor = Jimp.rgbaToInt(visitedRGBA.r, visitedRGBA.g, visitedRGBA.b, visitedRGBA.a)

            let customRGBA = hexToRGBA(this.config.debug.saveWrite.colors.custom)
            let customColor = Jimp.rgbaToInt(customRGBA.r, customRGBA.g, customRGBA.b, customRGBA.a)

            let instructionRGBA = hexToRGBA(this.config.debug.saveWrite.colors.instruction)
            let instructionColor = Jimp.rgbaToInt(instructionRGBA.r, instructionRGBA.g, instructionRGBA.b, instructionRGBA.a)


            // drawn pixels / visited pixels
            for (let pixel of this.drawnPixels) {
                this.drawPixels(pixel, visitedColor, imageOverlay)
            }

            //instruction pixels
            for (let pixel of this.instructionPixels) {
                this.drawPixels(pixel, instructionColor, imageOverlay)
            }

            //custom pixels
            if (custom != undefined) {
                for (let pixel of custom) {
                    this.drawPixels(pixel, customColor, imageOverlay)
                }
            }


            // overlay imageOverlay on tempImage
            tempImage.blit(imageOverlay, 0, 0)


            await tempImage.writeAsync(this.config.temp + "debug.png")
        }
    }

    /**
     * 
     * @param {string} pixelRange 
     * @param {number} color
     */
    drawPixels(pixelRange, color, img) {
        let [xS, yS] = pixelRange.split(",")
        let [x1, x2] = xS.split("-")
        let [y1, y2] = yS.split("-")

        let x = parseInt(x1)
        let y = parseInt(y1)

        let endX = parseInt(x2)
        let endY = parseInt(y2)

        for (let tempX = x; tempX <= endX; tempX++) {
            for (let tempY = y; tempY <= endY; tempY++) {
                img.setPixelColor(color, tempX, tempY)
            }
        }
    }


}

/**
 * @param {string} hex
 */
function hexToRGBA(hex) {
    let r = parseInt(hex.substring(1, 3), 16)
    let g = parseInt(hex.substring(3, 5), 16)
    let b = parseInt(hex.substring(5, 7), 16)
    let a = parseInt(hex.substring(7, 9), 16)
    return {
        r, g, b, a
    }
}