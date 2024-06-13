const Jimp = require('jimp')
const fs = require('fs')
const { ColorPalette, FloydSteinbergDither } = require('multidither')

const Config = require('./config/Config')
const Positions = require('./config/Positions')
const Setting = require('./config/Setting')
const InstructionWriter = require('./instructions/InstructionWriter')
const Resizer = require('./Resizer')
// const ProgressBar = require('progress')
const ProgressBar = require('./../lib/node-progress')




module.exports = class DrawManager {
    /**
     * @param {Config} config
     * @param {import("./gui/GuiBuilder")} guiBuilder
     */
    constructor(config, guiBuilder) {
        this.config = config.data
        this.resizer = new Resizer(config)
        this.instructionWriter = new InstructionWriter(config)
        this.guiBuilder = guiBuilder
        this.state = "idle"
        this.isAborting = false

        this.broadcastQueue = []


        setInterval(() => {
            // console.log("log message: " + logMessage)
            if (this.broadcastQueue.length > 0) {
                let logMessage = this.broadcastQueue.shift()
                guiBuilder.buildCalc(logMessage).serve()
            }
        }, 100)
        this.lastLog = Date.now()
        this.instructionWriter.logger = (message) => {
            this.#broadcastToGuiWD(message)
        }
    }

    #broadcastToGui(message) {
        this.broadcastQueue.push(message)
    }
    #broadcastToGuiWD(message) {
        let now = Date.now()
        if (now - this.lastLog > 500) {
            this.#broadcastToGui(message)
            this.lastLog = now
        }
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
        this.isAborting = false
        this.state = "initializing"

        this.settings = settings.data

        /**
         * @type {Jimp}
         */
        // @ts-ignore
        let img = this.settings.img

        console.time("total")
        this.guiBuilder.buildCalc("Calculating...").serve()
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
                this.guiBuilder.buildCalc("Image not found: " + img).serve()
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
                this.guiBuilder.buildCalc("Error reading image. see console for infos").serve()
                return
            }
        }

        this.state = "resizing"

        let position = positions.getPlatform(this.settings.platform)
        if (!position) {
            console.error("Platform not found")
            this.state = "idle"
            console.timeEnd("total")
            this.guiBuilder.buildCalc("Platform not found").serve()
            return
        }
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

        // change alpha value to be replaced with transparentColor. it is in hex format
        if (settings.data.transparentColor) {
            let transColor = Jimp.cssColorToHex(settings.data.transparentColor)
            resized.scan(0, 0, resized.bitmap.width, resized.bitmap.height, function (x, y, idx) {
                let r = this.bitmap.data[idx + 0]
                let g = this.bitmap.data[idx + 1]
                let b = this.bitmap.data[idx + 2]
                let a = this.bitmap.data[idx + 3]

                // merge the color with transparentColor. eliminate the alpha value
                // more transparent = more transparentColor. 0 alpha = 100% of transparentColor
                // 100 alpha = a mix of already present color and transparentColor
                if (a < 255) {
                    let newColor = Jimp.intToRGBA(transColor)
                    let newAlpha = 255 - a
                    let newR = Math.round((r * a + newColor.r * newAlpha) / 255)
                    let newG = Math.round((g * a + newColor.g * newAlpha) / 255)
                    let newB = Math.round((b * a + newColor.b * newAlpha) / 255)
                    this.bitmap.data[idx + 0] = newR
                    this.bitmap.data[idx + 1] = newG
                    this.bitmap.data[idx + 2] = newB
                    this.bitmap.data[idx + 3] = 255

                }
            })
            await resized.writeAsync(this.config.temp + 'transParentRemoved.png')

        }

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
        this.guiBuilder.buildCalc("Drawing...").serve()




        let barConfig = {
            text: "Drawing [:bar] :current/:total :percent :etas",
            data: {
                total: instructions.length,
                head: this.config.progressBar.head,
                incomplete: this.config.progressBar.incomplete,
                renderThrottle: this.config.progressBar.renderThrottle
            }
        }

        /**@type {ProgressBar} */
        let cmdBar

        let guiBar = new ProgressBar(barConfig.text.replace("Drawing ", ""), barConfig.data)

        if (this.config.progressBar.enabled) {
            cmdBar = new ProgressBar(barConfig.text, barConfig.data)
        }

        let pos = 0
        guiBar.start = new Date()
        for (let instruction of instructions) {
            // console.log(instruction)
            /*
            if (pos % 10 === 0) {
                if (this.isAborting || fs.existsSync(this.config.temp + this.config.abortingFile)) {
                    this.state = "idle"
                    console.log("aborted")
                    break
                }
                pos = 0
                let str = guiBar.render(undefined, true, this.config.guiProgressBar.availableSpace)
                if (str != "") {
                    this.#broadcastToGuiWD(str)
                }

            }
            //*/

            if (this.isAborting) {
                this.state = "idle"
                console.log("aborted")
                break
            }
            let str = guiBar.render(undefined, true, this.config.guiProgressBar.availableSpace)
            if (str != "") {
                this.#broadcastToGuiWD(str)
            }

            await instruction.execute()
            if (this.config.progressBar.enabled && cmdBar) {
                cmdBar.tick()
            }
            guiBar.curr++
            pos++
        }

        console.timeEnd("draw")
        console.timeEnd("total")
        this.state = "idle"
        this.guiBuilder.buildSelection(settings, positions).serve()


    }

    async abort() {
        console.log("aborting")
        this.isAborting = true
        if (this.state == "drawing") {
            // fs.writeFileSync(this.config.temp + this.config.abortingFile, "")
        }
        this.instructionWriter.isAborting = true
        console.timeEnd("draw")
        console.timeEnd("total")
        console.timeEnd('write')
    }
}