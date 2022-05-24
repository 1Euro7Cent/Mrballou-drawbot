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
        if (typeof img === 'string') {
            img = await Jimp.read(img)
        }

        let position = positions.getPlatform(this.settings.name)

        let size = {
            w: Math.round((position.bottomright.x - position.topleft.x) / this.settings.distancing),
            h: Math.round((position.bottomright.y - position.topleft.y) / this.settings.distancing)
        }

        console.log(`resizing to ${size.w}x${size.h}`)
        let resized = await this.resizer.resize(img, size)

        await resized.writeAsync(this.config.temp + 'resized.png')

        // resized = await resized.rotate(42)

        if (settings.data.dither) {

            let colors = Object.keys(position.colors)
            let dither = new FloydSteinbergDither(resized, new ColorPalette(colors))
            img = dither.dither(this.config.temp + 'dithered.png')
        }

        let instructions = this.instructionWriter.write(img, positions, settings)

        // console.log(instructions)
        let pos = 0
        for (let instruction of instructions) {
            // console.log(instruction)
            if (pos % 100 === 0) {
                if (fs.existsSync(this.config.temp + this.config.abortingFile)) {
                    break
                }
                pos = 0
            }
            instruction.execute()
            pos++
        }

        console.log('done')


    }
}