const Jimp = require("jimp")
const Config = require("../config/Config")
const DrawInstruction = require("./DrawInstruction")
const NearestColor = require("nearest-rgba")
const Setting = require("../config/Setting")
const Positions = require("../config/Positions")

module.exports = class InstructionWriter {
    /**
     * @param {Config} config
     */
    constructor(config) {
        this.config = config.data
        /**
         * @type {NearestColor}
         */
        // @ts-ignore
        this.nc = null
    }

    /**
     * @param {Jimp} img
     * @returns {DrawInstruction[]}
     * @param {Positions} positions
     * @param {Setting} settings
     */
    write(img, positions, settings) {
        this.settings = settings.data
        let instructions = []

        let position = positions.getPlatform(this.settings.name)



        let hexColors = Object.keys(position.colors)

        console.log(hexColors)

        this.ns = new NearestColor().fromHEX(hexColors)

        // recolor image to nearest colors and count colors
        let recolored = img.clone()
        let colors = {}
        for (let x = 0; x < img.bitmap.width; x++) {
            for (let y = 0; y < img.bitmap.height; y++) {
                let hex = img.getPixelColor(x, y)
                let rgba = Jimp.intToRGBA(hex)
                let nearest = this.ns.nearest(rgba, false)

                let nearestint = Jimp.rgbaToInt(nearest.r, nearest.g, nearest.b, nearest.a)
                let nearesthex = rgbToHex(nearest)
                recolored.setPixelColor(nearestint, x, y)
                colors[nearesthex] = colors[nearesthex] ? colors[nearesthex] + 1 : 1
            }
        }

        recolored.write(this.config.temp + 'recolored.png')
        // console.log(colors)


        if (this.settings.sortColors) {
            let arr
            switch (this.settings.sortColAlg) {
                case "size 0-9":
                    // sort by size smallest to largest
                    arr = objToArr(colors)
                    arr.sort((a, b) => {
                        return a[1] - b[1]
                    })
                    colors = arrToObj(arr)
                    break
                case 'size 9-0':
                    // sort by size largest to smallest
                    arr = objToArr(colors)
                    arr.sort((a, b) => {
                        return b[1] - a[1]
                    })
                    colors = arrToObj(arr)
                    break

                case 'name A-Z':
                    // sort by name alphabetically
                    arr = objToArr(colors)
                    arr.sort((a, b) => {
                        return a[0] > b[0] ? 1 : -1
                    })
                    colors = arrToObj(arr)

                    break

                case 'name Z-A':
                    // sort by name alphabetically
                    arr = objToArr(colors)
                    arr.sort((a, b) => {
                        return a[0] < b[0] ? 1 : -1
                    })
                    colors = arrToObj(arr)
                    break

                case 'random':
                    // shuffle colors
                    arr = objToArr(colors)
                    arr.sort(() => {
                        return 0.5 - Math.random()
                    })
                    colors = arrToObj(arr)
                    break

                case 'reverse':
                    // reverse colors
                    arr = objToArr(colors)
                    arr.reverse()
                    colors = arrToObj(arr)
                    break

            }
            // console.log(colors)
        }

        // return

        // make first dot at topleft to make shure we are focused in the right window

        instructions.push(new DrawInstruction('DOT', {
            x1: position.topleft.x,
            y1: position.topleft.y,
            delay: this.settings.delay
        }, 'INIT_WINDOW'))

        let lastColor = null
        // bucket 

        if (this.settings.bucket) {
            if (position.bucket?.x > 0 && position.bucket?.y > 0 &&
                position.pen.x > 0 && position.pen.y > 0) {


                let largestColor = Object.keys(colors).reduce((a, b) => colors[a] > colors[b] ? a : b)

                if (!settings.data.ignoreColors.includes(largestColor)) {

                    settings.data.ignoreColors = [largestColor]

                    instructions.push(new DrawInstruction('DOT', {
                        x1: position.bucket.x,
                        y1: position.bucket.y,
                        delay: this.settings.delay
                    }, 'SEL_BUCKET'))

                    let colPos = position.colors[largestColor]
                    instructions.push(new DrawInstruction('DOT', {
                        x1: colPos.x,
                        y1: colPos.y,
                        delay: this.settings.delay
                    }, 'SEL_BUCKET_COL'))

                    instructions.push(new DrawInstruction('DOT', {
                        x1: position.topleft.x + this.settings.distancing,
                        y1: position.topleft.y + this.settings.distancing,
                        delay: this.settings.delay
                    }, 'DRAW_BUCKET'))

                    instructions.push(new DrawInstruction('DOT', {
                        x1: position.pen.x,
                        y1: position.pen.y,
                        delay: this.settings.delay
                    }, 'SEL_PEN'))

                    lastColor = largestColor
                }
            }
            else {
                console.log("Bucket not found")
            }
        }



        console.log(`ignoring colors:`, settings.data.ignoreColors)
        console.log("writing instructions...")
        console.time("write")
        for (let color in colors) {

            if (settings.data.ignoreColors.includes(color)) continue
            /**
             * this variable stores pixels already drawn to not waste time on drawing them again
             * @type {string[]}
             */
            let drawnPixels = []


            for (let y = 0; y < recolored.bitmap.height; y++) {
                for (let x = 0; x < recolored.bitmap.width; x++) {
                    let numb = recolored.getPixelColor(x, y)
                    let rgba = Jimp.intToRGBA(numb)
                    let hex = rgbToHex(rgba)

                    if (color != hex) continue
                    if (!lastColor || hex !== lastColor) {
                        lastColor = hex
                        let pos = position.colors[hex]
                        // console.log(pos)
                        // console.log(hex)
                        let instruction = new DrawInstruction('DOT', {
                            x1: pos.x,
                            y1: pos.y,
                            delay: this.settings.delay + this.settings.colorDelay
                        },
                            "SET_COLOR")
                        instructions.push(instruction)
                    }

                    if (this.settings.fast) {
                        let looping = true
                        let fy = y
                        let fx = x
                        let xPixels = 0
                        let yPixels = 0

                        let foundPixels = drawnPixels.find((p) => {
                            let [xS, yS] = p.split(",")
                            let [x1, x2] = xS.split("-")
                            let [y1, y2] = yS.split("-")



                            // check if x and y is in range
                            return isInRange(x, x1, x2,) && isInRange(y, y1, y2)

                        })

                        if (this.settings.lineSaving && typeof foundPixels != 'undefined') continue

                        for (let fx = x; looping; fx++) {

                            let fnumb = recolored.getPixelColor(fx, fy)
                            let frgba = Jimp.intToRGBA(fnumb)
                            let fhex = rgbToHex(frgba)
                            if (fhex == hex) {
                                xPixels++
                            }
                            else {

                                looping = false
                            }

                            // if (pixels <= 0) break

                            looping = fx < recolored.bitmap.width && looping
                            if ((!this.settings.lineSaving) && (!looping)) {
                                if (xPixels > 1) {
                                    let pos1 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                    let pos2 = relativeToAbsolute(x, y, position, this.settings.distancing, xPixels - 1, 0)
                                    instructions.push(new DrawInstruction('DRAG', {
                                        x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, delay: this.settings.delay,
                                    }, "DRAW_LINE"))
                                }
                                else {
                                    let pos = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                    instructions.push(new DrawInstruction('DOT', {
                                        x1: pos.x, y1: pos.y, delay: this.settings.delay
                                    }, "DRAW_PIXEL"))

                                }
                                x = fx

                            }

                        }

                        if (this.settings.lineSaving) {
                            looping = true
                            for (let fy = y; looping; fy++) {

                                let fnumb = recolored.getPixelColor(fx, fy)
                                let frgba = Jimp.intToRGBA(fnumb)
                                let fhex = rgbToHex(frgba)
                                if (fhex == hex) {
                                    yPixels++
                                }
                                else {

                                    looping = false
                                }

                                // if (pixels <= 0) break

                                looping = fy < recolored.bitmap.height && looping
                            }
                            let largest = Math.max(xPixels, yPixels)
                            if (largest > 1) {
                                if (xPixels >= yPixels) {
                                    // draw x
                                    let pos1 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                    let pos2 = relativeToAbsolute(x, y, position, this.settings.distancing, xPixels - 1, 0)
                                    instructions.push(new DrawInstruction('DRAG', {
                                        x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, delay: this.settings.delay,
                                    }, "DRAW_LINE"))


                                    drawnPixels.push(`${x}-${x + (xPixels - 1)},${y}-${y}`)
                                    // addLTodrawn(instructions, drawnPixels)


                                }
                                else {
                                    // draw y
                                    let pos1 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                    let pos2 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, yPixels - 1)
                                    instructions.push(new DrawInstruction('DRAG', {
                                        x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, delay: this.settings.delay,
                                    }, "DRAW_LINE"))

                                    // addLTodrawn(instructions, drawnPixels)
                                    drawnPixels.push(`${x}-${x},${y}-${y + (yPixels - 1)}`)
                                }
                            }
                            else {
                                let pos = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                instructions.push(new DrawInstruction('DOT', {
                                    x1: pos.x, y1: pos.y, delay: this.settings.delay
                                }, "DRAW_PIXEL"))
                            }

                        }

                    }
                    else {
                        let pos = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                        let instruction = new DrawInstruction('DOT', {
                            x1: pos.x, y1: pos.y, delay: this.settings.delay
                        }, "DRAW_PIXEL")
                        instructions.push(instruction)
                    }
                }
            }

        }
        console.log(`Done! Created ${instructions.length} instructions.`)
        // console.timeLog()
        console.timeEnd('write')

        // make shure EVERY draw instruction is in bounds

        for (let instruction of instructions) {
            if (instruction.comment.toLowerCase().includes('draw')) {
                if (instruction.cords.x1 < position.topleft.x || instruction.cords.x1 > position.bottomright.x ||
                    instruction.cords.y1 < position.topleft.y || instruction.cords.y1 > position.bottomright.y ||

                    // @ts-ignore
                    instruction.cords.x2 < position.topleft.x || instruction.cords.x2 > position.bottomright.x ||
                    // @ts-ignore
                    instruction.cords.y2 < position.topleft.y || instruction.cords.y2 > position.bottomright.y
                ) {
                    instruction.comment = 'OUT_OF_BOUNDS'

                }

                if (instruction.type == 'DRAG' || instruction.type == 'DRAGNOTRELEASE') {
                    // @ts-ignore
                    instruction.cords.x2 = instruction.cords.x2 > position.bottomright.x ? position.bottomright.x : instruction.cords.x2
                    // @ts-ignore
                    instruction.cords.x2 = instruction.cords.x2 < position.topleft.x ? position.topleft.x : instruction.cords.x2

                    // @ts-ignore
                    instruction.cords.y2 = instruction.cords.y2 > position.bottomright.y ? position.bottomright.y : instruction.cords.y2
                    // @ts-ignore
                    instruction.cords.y2 = instruction.cords.y2 < position.topleft.y ? position.topleft.y : instruction.cords.y2

                    instruction.cords.x1 = instruction.cords.x1 > position.bottomright.x ? position.bottomright.x : instruction.cords.x1
                    instruction.cords.x1 = instruction.cords.x1 < position.topleft.x ? position.topleft.x : instruction.cords.x1

                    instruction.cords.y1 = instruction.cords.y1 > position.bottomright.y ? position.bottomright.y : instruction.cords.y1
                    instruction.cords.y1 = instruction.cords.y1 < position.topleft.y ? position.topleft.y : instruction.cords.y1
                }
            }

        }

        // remove every out of bounds
        instructions = instructions.filter(i => i.comment !== 'OUT_OF_BOUNDS')

        // add onTimeDelay to all instructions

        if (this.settings.onTimeDelay) {
            for (let i = 0; i < instructions.length; i++) {
                let instruction = instructions[i]
                if (instruction.cords.delay) {
                    instruction.cords.delay += this.settings.onTimeDelayMultiplyer * i
                }


            }
        }


        return instructions
    }
}

/**
 * @param {DrawInstruction[]} instructions
 * @param {string[]} drawnPixels
 */
// @ts-ignore
function addLTodrawn(instructions, drawnPixels) {
    drawnPixels.push(`${instructions[instructions.length - 1].cords.x1}-${instructions[instructions.length - 1].cords.x2 ?? 0},${instructions[instructions.length - 1].cords.y1}-${instructions[instructions.length - 1].cords.y2 ?? 0}`)

}

/**
 * @param {string | number} value
 * @param {string | number} min
 * @param {string | number} max
 * @returns {boolean}
 */
function isInRange(value, min, max) {
    if (typeof value !== 'number') value = parseInt(value)
    if (typeof min !== 'number') min = parseInt(min)
    if (typeof max !== 'number') max = parseInt(max)

    return value >= min && value <= max
}

/**
 * @param {number} x
 * @param {number} y
 * @param {{ topleft: { x: number; y: number; }; }} position
 * @param {number} distancing
 * @param {number} xModifyer
 * @param {number} yModifyer
 */
function relativeToAbsolute(x, y, position, distancing, xModifyer, yModifyer) {
    return {
        x: (x * distancing) + position.topleft.x + (xModifyer * distancing),
        y: (y * distancing) + position.topleft.y + (yModifyer * distancing)
    }

}


/**
 * @param {{}} obj
 * @returns {any[]}
 * @example
 * let colors = {
 * '#000000': 187,
 * '#0000ff': 33,
 * }
 * objToArray(colors) => [
 * ['#000000', 187],
 * ['#0000ff', 33],
 * ]
 */
function objToArr(obj) {
    let arr = []
    for (let key in obj) {
        arr.push([key, obj[key]])
    }
    return arr
}
/**
 * @param {[any, any][]} arr
 */
function arrToObj(arr) {
    let obj = {}
    for (let i = 0; i < arr.length; i++) {
        let [key, value] = arr[i]
        obj[key] = value
    }
    return obj
}

function rgbToHex(rgb) {
    let r = rgb.r.toString(16)
    let g = rgb.g.toString(16)
    let b = rgb.b.toString(16)
    if (r.length < 2) r = "0" + r
    if (g.length < 2) g = "0" + g
    if (b.length < 2) b = "0" + b
    return "#" + r + g + b
}