const Jimp = require('jimp')
const fs = require('fs')
const { ColorPalette, FloydSteinbergDither } = require('multidither')

const Config = require('./config/Config')
const Positions = require('./config/Positions')
const Setting = require('./config/Setting')
const InstructionWriter = require('./instructions/InstructionWriter')
const Resizer = require('./Resizer')


module.exports = class DrawManager {
    /**
     * @param {Config} config
     */
    constructor(config) {
        this.config = config.data
        this.resizer = new Resizer(config)
        this.instructionWriter = new InstructionWriter(config)
    }

    /**
     * @param {Setting} settings
     * @param {Positions} positions
     */
    async startDraw(settings, positions) {

        this.settings = settings.data

        /**
         * @type {Jimp}
         */
        // @ts-ignore
        let img = this.settings.img

        console.time("total")
        // if base64 encode the image
        if (this.settings.img.startsWith("data:image/")) {
            let decode = Buffer.from(this.settings.img.split(',')[1], 'base64')
            fs.writeFileSync(this.config.temp + 'decoded.png', decode)
            // @ts-ignore
            img = this.config.temp + 'decoded.png'
        }

        // @ts-ignore
        if (typeof img == "string" && !img.startsWith("http")) {
            if (!fs.existsSync(img)) {
                console.error("Image not found: " + img)
                return
            }

        }


        if (typeof img == 'string') {

            try {
                img = await Jimp.read(img)
            }
            catch (e) {
                console.error(e)
                console.timeEnd("total")
                return
            }
        }

        let position = positions.getPlatform(this.settings.name)

        let size = {
            w: Math.round((position.bottomright.x - position.topleft.x) / this.settings.distancing),
            h: Math.round((position.bottomright.y - position.topleft.y) / this.settings.distancing)
        }

        console.log(`resizing to ${size.w}x${size.h}`)
        let resized = await this.resizer.resize(img, size)

        await resized.writeAsync(this.config.temp + 'resized.png')

        // let resized = img // to test stuff

        // resized = await resized.rotate(42)

        if (settings.data.dither) {

            let colors = Object.keys(position.colors)
            let dither = new FloydSteinbergDither(resized, new ColorPalette(colors))
            img = dither.dither(this.config.temp + 'dithered.png')
        }

        let instructions = await this.instructionWriter.write(img, positions, settings)

        // console.log(instructions)
        console.time("draw")
        let pos = 0
        for (let instruction of instructions) {
            // console.log(instruction)
            if (pos % 10 === 0) {
                if (fs.existsSync(this.config.temp + this.config.abortingFile)) {
                    break
                }
                pos = 0
            }
            await instruction.execute()
            pos++
        }

        console.timeEnd("draw")
        console.timeEnd("total")


    }
}