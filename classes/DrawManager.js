const Jimp = require('jimp')
const fs = require('fs')
const { ColorPalette, FloydSteinbergDither } = require('multidither')

const Config = require('./config/Config')
const Positions = require('./config/Positions')
const Setting = require('./config/Setting')
const InstructionWriter = require('./instructions/InstructionWriter')
const Resizer = require('./Resizer')
const ProgressBar = require('progress')



module.exports = class DrawManager {
    /**
     * @param {Config} config
     */
    constructor(config) {
        this.config = config.data
        this.resizer = new Resizer(config)
        this.instructionWriter = new InstructionWriter(config)
        this.state = "idle"
    }

    /**
     * @param {Setting} settings
     * @param {Positions} positions
     */
    async startDraw(settings, positions) {
        if (this.state != "idle") {
            console.error("Already drawing")
            return
        }
        this.state = "initializing"

        this.settings = settings.data

        /**
         * @type {Jimp}
         */
        // @ts-ignore
        let img = this.settings.img

        console.time("total")
        // if base64 encode the image
        this.state = "decoding"
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
                this.state = "idle"
                console.timeEnd("total")
                return
            }

        }

        this.state = "reading image"

        if (typeof img == 'string') {

            try {
                img = await Jimp.read(img)
            }
            catch (e) {
                console.error(e)
                console.timeEnd("total")
                this.state = "idle"
                return
            }
        }

        this.state = "resizing"

        let position = positions.getPlatform(this.settings.name)
        if (settings.data.positionOverride.enabled) {
            position.topleft = {
                x: settings.data.positionOverride.x1,
                y: settings.data.positionOverride.y1
            }
            position.bottomright = {
                x: settings.data.positionOverride.x2,
                y: settings.data.positionOverride.y2
            }
        }

        let size = {
            w: Math.round((position.bottomright.x - position.topleft.x) / this.settings.distancing),
            h: Math.round((position.bottomright.y - position.topleft.y) / this.settings.distancing)
        }

        console.log(`resizing to ${size.w}x${size.h}`)
        // @ts-ignore
        // let resized = await this.resizer.resize(img, size, settings.data.resizeImgAlg)

        /**
         * @type {Jimp}
         */
        let resized

        if (settings.data.resizeImgAlg == "fit") {
            console.log("calculating optimal sizes")
            let orRatio = img.bitmap.width / img.bitmap.height
            let ratio = size.w / size.h

            if (ratio > orRatio) {
                // size.h = size.h
                size.w = size.h * orRatio
            }
            else {
                // size.w = size.w
                size.h = size.w / orRatio
            }

            console.log(`recalculated sizes to max ${size.w}x${size.h}`)
            resized = await this.resizer.resize(img, size, "stretch") // we calculated the optimal sizes already. the module does not need to do it again
        }
        // @ts-ignore
        else resized = await this.resizer.resize(img, size, settings.data.resizeImgAlg)

        // let resized = await img.resize(size.w, size.h)

        await resized.writeAsync(this.config.temp + 'resized.png')

        // let resized = img // to test stuff

        // resized = await resized.rotate(42)


        if (settings.data.dither) {
            this.state = "dithering"

            let colors = Object.keys(position.colors)
            let dither = new FloydSteinbergDither(resized, new ColorPalette(colors))
            img = dither.dither(this.config.temp + 'dithered.png')
        }

        this.state = "writing instructions"
        let instructions = await this.instructionWriter.write(img, positions, settings)

        this.state = "drawing"
        // console.log(instructions)
        console.time("draw")
        /**@type {ProgressBar} */
        let bar

        if (this.config.progressBar.enabled) {
            /** @type {number | undefined}*/
            let width
            if (this.config.progressBar.width === null) {
                width = undefined
            }
            else {
                width = this.config.progressBar.width
            }



            bar = new ProgressBar('drawing [:bar] :current/:total :percent :etas', {
                total: instructions.length,
                width: width,
                head: this.config.progressBar.head,
                incomplete: this.config.progressBar.incomplete,
                renderThrottle: this.config.progressBar.renderThrottle
            })
        }

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
            if (this.config.progressBar.enabled && bar) {

                bar.tick()
            }
            pos++
        }

        console.timeEnd("draw")
        console.timeEnd("total")


    }
}