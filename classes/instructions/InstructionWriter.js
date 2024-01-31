const Jimp = require("jimp")
const Config = require("../config/Config")
const DrawInstruction = require("./DrawInstruction")
const NearestColor = require("nearest-rgba")
const Setting = require("../config/Setting")
const Positions = require("../config/Positions")
const DebugSaver = require("./../DebugSaver")

module.exports = class InstructionWriter {
    #preSendIndex = 0
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

        if (this.config.debug.enabled && this.config.debug.saveWrite.enabled) {
            this.debug = new DebugSaver(config)
        }
        this.isAborting = false

        this.logger = (...args) => { }
        /**
         * @type {function(DrawInstruction[]):void}
         */
        this.partialFinish = () => { }

        this.isWriting = false


    }

    /**
     * @param {Jimp} img
     * @returns {Promise<DrawInstruction[]>}
     * @param {Positions} positions
     * @param {Setting} settings
     * @param {function(DrawInstruction[]):void} [partialFinish] this gets called when a instruction write is finished
     */
    async write(img, positions, settings, partialFinish) {
        this.isWriting = true
        this.isAborting = false
        this.settings = settings.data
        if (typeof partialFinish == 'function') this.partialFinish = partialFinish

        if (this.debug) {
            this.debug.instructionPixels = []
            this.debug.srCImage = img
        }
        let instructions = []
        let ignoreColors = []

        //bring settings.data.ignoredColors to the old format


        for (let color in settings.data.ignoreColors) {
            if (typeof color == 'string') {
                ignoreColors.push(color)
            }
        }

        let position = positions.getPlatform(this.settings.platform)
        this.positions = position

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

        /**
         positionImgAlgs= [
            "topLeft",
            "topCenter",
            "topRight",
            "centerLeft",
            "center",
            "centerRight",
            "bottomLeft",
            "bottomCenter",
            "bottomRight"
        ]
         */

        /**
         * 0 = no offset at all. aka the image is at the top left corner
         * the higher the number the more to the right and down the image is located
         */
        let offsets = {
            x: 0,
            y: 0
        }

        let centerX = (position.width / 2) - (img.bitmap.width * this.settings.distancing / 2)
        let centerY = (position.height / 2) - (img.bitmap.height * this.settings.distancing / 2)

        // calculate the offsets based on the position algorithm
        switch (this.settings.positionImgAlg) {
            case "topLeft":
                offsets.x = 0
                offsets.y = 0
                break

            case "topCenter":
                offsets.x = centerX
                offsets.y = 0
                break

            case "topRight":
                offsets.x = position.width - (img.bitmap.width * this.settings.distancing)
                offsets.y = 0
                break

            case "centerLeft":
                offsets.x = 0
                offsets.y = centerY
                break

            case "center":
                offsets.x = centerX
                offsets.y = centerY
                break

            case "centerRight":
                offsets.x = position.width - (img.bitmap.width * this.settings.distancing)
                offsets.y = centerY
                break

            case "bottomLeft":
                offsets.x = 0
                offsets.y = position.height - (img.bitmap.height * this.settings.distancing)
                break

            case "bottomCenter":
                offsets.x = centerX
                offsets.y = position.height - (img.bitmap.height * this.settings.distancing)
                break

            case "bottomRight":
                offsets.x = position.width - (img.bitmap.width * this.settings.distancing)
                offsets.y = position.height - (img.bitmap.height * this.settings.distancing)
                break


            default:
                throw new Error("Invalid positionImgAlg: " + this.settings.positionImgAlg)

        }


        // round offsets
        offsets.x = Math.round(offsets.x)
        offsets.y = Math.round(offsets.y)

        offsets.y = Math.max(0, offsets.y)
        offsets.x = Math.max(0, offsets.x)

        // make shure that offset is divisible by distancing to avoid skipping lines
        offsets.y = Math.floor(offsets.y / this.settings.distancing) * this.settings.distancing
        offsets.x = Math.floor(offsets.x / this.settings.distancing) * this.settings.distancing

        console.log("offsets:", offsets)



        let hexColors = Object.keys(position.colors)

        // console.log(hexColors)

        this.nc = new NearestColor().fromHEX(hexColors)

        // recolor image to nearest colors and count colors
        let recolored = img.clone()
        let colors = {}
        for (let x = 0; x < img.bitmap.width; x++) {
            for (let y = 0; y < img.bitmap.height; y++) {
                let hex = img.getPixelColor(x, y)
                let rgba = Jimp.intToRGBA(hex)
                let nearest = this.nc.nearest(rgba, false)

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
            delay: this.settings.delay,
            moveDelay: this.settings.moveDelay
        }, "left", 'INIT_WINDOW'))

        let largestColor = Object.keys(colors).reduce((a, b) => colors[a] > colors[b] ? a : b)

        if (this.settings.box || this.settings.bucket) {
            let colPos = position.colors[largestColor]
            instructions.push(new DrawInstruction('DOT', {
                x1: colPos.x,
                y1: colPos.y,
                delay: this.settings.delay,
                moveDelay: this.settings.moveDelay
            }, "left", 'SEL_LARGEST_COL'))
        }

        //box
        if (this.settings.box) {
            // add a perimeter around the image
            let topAbs = relativeToAbsolute(img.bitmap.width - 1, 0, position, this.settings.distancing, 0, 0)
            instructions.push(new DrawInstruction('DRAGNOTRELEASE', {
                x1: position.topleft.x + this.settings.distancing + offsets.x - 1,
                y1: topAbs.y + offsets.y,
                x2: topAbs.x + offsets.x,
                y2: topAbs.y + offsets.y,
                delay: this.settings.delay,
                moveDelay: this.settings.moveDelay
            }, "left", 'DRAW_TOP'))
            let last = topAbs

            let rightAbs = relativeToAbsolute(img.bitmap.width - 1, img.bitmap.height - 1, position, this.settings.distancing, 0, 0)
            instructions.push(new DrawInstruction('MOVE', {
                x1: last.x + offsets.x,
                y1: rightAbs.y + offsets.y,
                delay: this.settings.delay,
                moveDelay: this.settings.moveDelay
            }, "left", 'DRAW_RIGHT'))
            last = rightAbs

            let bottomAbs = relativeToAbsolute(0, 0, position, this.settings.distancing, 0, 0)
            instructions.push(new DrawInstruction('MOVE', {
                x1: bottomAbs.x + offsets.x,
                y1: last.y + offsets.y,
                delay: this.settings.delay,
                moveDelay: this.settings.moveDelay
            }, "left", 'DRAW_BOTTOM'))
            last = bottomAbs

            let leftAbs = relativeToAbsolute(0, 0, position, this.settings.distancing, 0, 0)
            instructions.push(new DrawInstruction('MOVE', {
                x1: last.x + offsets.x,
                y1: leftAbs.y + offsets.y,
                delay: this.settings.delay,
                moveDelay: this.settings.moveDelay
            }, "left", 'DRAW_LEFT'))

            instructions.push(new DrawInstruction('RELEASE', { x1: 0, y1: 0 }, "left", 'RELEASE_LEFT'))


        }

        await this.#sendPartial(instructions)

        // bucket 
        if (this.settings.bucket) {
            if (position.bucket?.x > 0 && position.bucket?.y > 0 &&
                position.pen.x > 0 && position.pen.y > 0) {



                if (!ignoreColors.includes(largestColor)) {

                    ignoreColors = [largestColor]

                    instructions.push(new DrawInstruction('DOT', {
                        x1: position.bucket.x,
                        y1: position.bucket.y,
                        delay: this.settings.delay,
                        moveDelay: this.settings.moveDelay
                    }, "left", 'SEL_BUCKET'))

                    let colPos = position.colors[largestColor]
                    instructions.push(new DrawInstruction('DOT', {
                        x1: colPos.x,
                        y1: colPos.y,
                        delay: this.settings.delay,
                        moveDelay: this.settings.moveDelay
                    }, "left", 'SEL_BUCKET_COL'))

                    instructions.push(new DrawInstruction('DOT', {
                        x1: position.topleft.x + this.settings.distancing + offsets.x,
                        y1: position.topleft.y + this.settings.distancing + offsets.y,
                        delay: this.settings.delay,
                        moveDelay: this.settings.moveDelay
                    }, "left", 'DRAW_BUCKET'))

                    instructions.push(new DrawInstruction('DOT', {
                        x1: position.pen.x,
                        y1: position.pen.y,
                        delay: this.settings.delay,
                        moveDelay: this.settings.moveDelay
                    }, "left", 'SEL_PEN'))

                    ignoreColors.push(largestColor)
                }
            }
            else {
                console.log("Bucket not found")
            }
            await this.#sendPartial(instructions)

        }

        /**
         * this variable stores pixels already drawn to not waste time on drawing them again
         * @type {string[]}
         */
        let drawnPixels = []
        let isSecondary = false
        /**@type {string | undefined} */
        let nextColor


        console.log(`ignoring colors:`, ignoreColors)
        console.log("writing instructions...")
        console.time("write")
        // console.log(colors)
        if (this.settings.onePassMode) {
            // draw the whole image in one pass. is is much slower because it has to change colors dozens of times, but is more satisfying to watch

            for (let y = 0; y < recolored.bitmap.height; y++) {
                await this.#sendPartial(instructions)

                console.timeLog("write", `writing line ${y}`)
                this.logger(`Calculating...\nwriting line ${y}/${recolored.bitmap.height}`)
                if (this.isAborting) return []
                await sleep(5)
                let colorsInLine = []
                let colorCache = []
                for (let x = 0; x < recolored.bitmap.width; x++) {
                    if (this.isAborting) return []
                    let numb = recolored.getPixelColor(x, y)
                    let rgba = Jimp.intToRGBA(numb)
                    let hex = rgbToHex(rgba)

                    colorCache.push(hex)
                    if (ignoreColors.includes(hex)) continue
                    if (colorsInLine.includes(hex)) continue
                    // colorsInLine[hex] = colorsInLine[hex] ? colorsInLine[hex] + 1 : 1
                    colorsInLine.push(hex)
                }


                for (let color of colorsInLine) {
                    let pos = position.colors[color]

                    instructions.push(new DrawInstruction('DOT', {
                        x1: pos.x,
                        y1: pos.y,
                        delay: this.settings.delay + this.settings.colorDelay,
                        moveDelay: this.settings.moveDelay
                    },
                        "left", "SET_COLOR"))

                    let currPos = -1

                    for (let colorC of colorCache) {
                        currPos++
                        if (colorC != color) continue
                        let pos = relativeToAbsolute(currPos, y, position, this.settings.distancing, 0, 0)
                        instructions.push(new DrawInstruction('DOT', {
                            x1: pos.x + offsets.x,
                            y1: pos.y + offsets.y,
                            delay: this.settings.delay,
                            moveDelay: this.settings.moveDelay
                        }, "left", "DRAW_PIXEL"))
                    }



                }


            }
        }
        else {
            let colorCounter = 0
            let colorCount = objToArr(colors).length
            for (let color in colors) {
                colorCounter++

                // skip a color after two has been drawn at once
                if (this.settings.dualColorMode && isSecondary) {
                    isSecondary = false
                    continue
                }

                // next color is the color that will be drawn after this one. that should NOT be a ignored color
                nextColor = getNextKey(colors, color, ignoreColors)



                if (ignoreColors.includes(color)) continue

                // if (this.debug) {
                //     this.debug.drawnPixels = this.debug.drawnPixels.concat(drawnPixels)
                //     // await this.debug.makeImage()
                // }

                drawnPixels = []


                process.stdout.write('    ')
                let logText = `writing color ${color} ${colorCounter}/${colorCount} ${this.settings.dualColorMode && nextColor ? 'and ' + nextColor : ''}`
                console.timeLog("write", logText)
                this.logger("Calculating...\n" + logText)
                await this.#sendPartial(instructions)

                if (this.isAborting) return []
                await sleep(5)
                // console.log("next color", nextColor)


                let pos = position.colors[color]




                instructions.push(new DrawInstruction('DOT', {
                    x1: pos.x,
                    y1: pos.y,
                    delay: this.settings.delay + this.settings.colorDelay,
                    moveDelay: this.settings.moveDelay
                },
                    "left", "SET_COLOR"))

                if (this.settings.dualColorMode) {
                    if (nextColor) instructions.push(new DrawInstruction('DOT', {
                        x1: position.secondaryColor.x,
                        y1: position.secondaryColor.y,
                        delay: this.settings.delay + this.settings.colorDelay,
                        moveDelay: this.settings.moveDelay
                    },
                        "left", 'SEL_SECONDARY'))
                    else instructions.push(new DrawInstruction('DOT', {
                        x1: position.primaryColor.x,
                        y1: position.primaryColor.y,
                        delay: this.settings.delay,
                        moveDelay: this.settings.moveDelay
                    },
                        "left", 'SEL_PRIMARY'))

                    let posSecondary = position.colors[nextColor ?? color]

                    instructions.push(new DrawInstruction('DOT', {
                        x1: posSecondary.x,
                        y1: posSecondary.y,
                        delay: this.settings.delay,
                        moveDelay: this.settings.moveDelay
                    },
                        "left", "SET_COLOR"))

                    if (this.settings.dualColorMode) instructions.push(new DrawInstruction('DOT', {
                        x1: position.primaryColor.x,
                        y1: position.primaryColor.y,
                        delay: this.settings.delay + this.settings.colorDelay,
                        moveDelay: this.settings.moveDelay
                    },
                        "left", 'SEL_PRIMARY'))


                }


                for (let y = 0; y < recolored.bitmap.height; y++) {
                    if (this.isAborting) return []
                    for (let x = 0; x < recolored.bitmap.width; x++) {
                        let numb = recolored.getPixelColor(x, y)
                        let rgba = Jimp.intToRGBA(numb)
                        let hex = rgbToHex(rgba)

                        if (this.settings.dualColorMode && !(color == hex || nextColor == hex)) continue
                        if (!this.settings.dualColorMode && color != hex) continue

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

                                looping = fx < recolored.bitmap.width - 1 && looping
                                if ((!this.settings.lineSaving) && (!looping)) {
                                    if (xPixels > 1) {
                                        let pos1 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                        let pos2 = relativeToAbsolute(x, y, position, this.settings.distancing, xPixels - 1, 0)
                                        instructions.push(new DrawInstruction('DRAG', {
                                            x1: pos1.x + offsets.x,
                                            y1: pos1.y + offsets.y,
                                            x2: pos2.x + offsets.x,
                                            y2: pos2.y + offsets.y,
                                            delay: this.settings.delay,
                                            moveDelay: this.settings.moveDelay
                                        }, hex == nextColor ? "right" : "left", "DRAW_LINE"))
                                    }
                                    else {
                                        let pos = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                        instructions.push(new DrawInstruction('DOT', {
                                            x1: pos.x + offsets.x,
                                            y1: pos.y + offsets.y,
                                            delay: this.settings.delay,
                                            moveDelay: this.settings.moveDelay
                                        }, hex == nextColor ? "right" : "left", "DRAW_PIXEL"))

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

                                    looping = fy < recolored.bitmap.height - 1 && looping
                                }
                                let largest = Math.max(xPixels, yPixels)
                                if (largest > 1) {
                                    if (xPixels >= yPixels) {
                                        // draw x
                                        let pos1 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                        let pos2 = relativeToAbsolute(x, y, position, this.settings.distancing, xPixels - 1, 0)
                                        instructions.push(new DrawInstruction('DRAG', {
                                            x1: pos1.x + offsets.x,
                                            y1: pos1.y + offsets.y,
                                            x2: pos2.x + offsets.x,
                                            y2: pos2.y + offsets.y,
                                            delay: this.settings.delay,
                                            moveDelay: this.settings.moveDelay
                                        }, hex == nextColor ? "right" : "left", "DRAW_LINE"))

                                        let pixString = `${x}-${x + (xPixels - 1)},${y}-${y}`
                                        this.debug?.drawnPixels.push(pixString)

                                        await this.debug?.makeImage(pixString)
                                        drawnPixels.push(pixString)
                                        x += xPixels
                                        // addLTodrawn(instructions, drawnPixels)


                                    }
                                    else {
                                        // draw y
                                        let pos1 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                        let pos2 = relativeToAbsolute(x, y, position, this.settings.distancing, 0, yPixels - 1)
                                        instructions.push(new DrawInstruction('DRAG', {
                                            x1: pos1.x + offsets.x,
                                            y1: pos1.y + offsets.y,
                                            x2: pos2.x + offsets.x,
                                            y2: pos2.y + offsets.y,
                                            delay: this.settings.delay,
                                            moveDelay: this.settings.moveDelay
                                        }, hex == nextColor ? "right" : "left", "DRAW_LINE"))

                                        // addLTodrawn(instructions, drawnPixels)
                                        let pixString = `${x}-${x},${y}-${y + (yPixels - 1)}`
                                        this.debug?.drawnPixels.push(pixString)

                                        await this.debug?.makeImage(pixString)
                                        drawnPixels.push(pixString)
                                    }
                                }
                                else {
                                    let pos = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                                    instructions.push(new DrawInstruction('DOT', {
                                        x1: pos.x + offsets.x,
                                        y1: pos.y + offsets.y,
                                        delay: this.settings.delay,
                                        moveDelay: this.settings.moveDelay
                                    }, hex == nextColor ? "right" : "left", "DRAW_PIXEL"))

                                    this.debug?.customPixels.push(`${x},${y}`)
                                }

                            }

                        }
                        else {
                            let pos = relativeToAbsolute(x, y, position, this.settings.distancing, 0, 0)
                            let instruction = new DrawInstruction('DOT', {
                                x1: pos.x + offsets.x,
                                y1: pos.y + offsets.y,
                                delay: this.settings.delay,
                                moveDelay: this.settings.moveDelay
                            }, hex == nextColor ? "right" : "left", "DRAW_PIXEL")
                            instructions.push(instruction)
                            this.debug?.customPixels.push(`${x},${y}`)
                        }
                    }
                }

                isSecondary = !isSecondary

            }
        }

        // return
        instructions = removeUnwantedInstructions(instructions, position)
        instructions = addOnTimeDelay(instructions, this.settings)



        // return []
        console.log(`Done! Created ${instructions.length} instructions.`)
        // console.timeLog()
        console.timeEnd('write')
        this.isWriting = false

        return instructions
        // return removeUnwantedInstructions(instructions, position)
    }
    /**
     * @param {DrawInstruction[]} instructions
     */
    async  #sendPartial(instructions) {
        if (!this.positions) return
        let partial = instructions.slice(this.#preSendIndex)
        this.#preSendIndex = instructions.length
        partial = removeUnwantedInstructions(partial, this.positions)
        partial = addOnTimeDelay(partial, this.settings)
        this.partialFinish(partial)
        if (this.settings?.startBeforeFinished) {
            await sleep(100)

        }

    }

}

/**
 * @param {DrawInstruction[]} instructions
 * @param {{ topleft: { x: number; y: number; }; bottomright: { x: number; y: number; }; }} position
 * @returns {DrawInstruction[]}
 */
function removeUnwantedInstructions(instructions, position) {

    // make shure EVERY draw instruction is in bounds

    for (let instruction of instructions) {

        // dot operations
        if (instruction.type == 'DOT' && instruction.comment.toLowerCase().includes("draw")) {
            let pos = instruction.cords
            if (pos.x1 < position.topleft.x || pos.y1 < position.topleft.y || pos.x1 > position.bottomright.x || pos.y1 > position.bottomright.y) {
                instruction.comment = "OUT_OF_BOUNDS"
            }
        }


        // drag operations. when out of bounds make them in bounds
        if (instruction.type == 'DRAG' && instruction.comment.toLowerCase().includes("draw")) {
            let pos = instruction.cords
            if (pos.x1 < position.topleft.x || pos.y1 < position.topleft.y) {
                instruction.comment = "OUT_OF_BOUNDS"
            }

            if (typeof pos.x2 == 'number' && typeof pos.y2 == 'number') {
                // making in bounds
                if (pos.x2 < position.topleft.x) pos.x2 = position.topleft.x

                if (pos.y2 < position.topleft.y) pos.y2 = position.topleft.y
                if (pos.x2 > position.bottomright.x) pos.x2 = position.bottomright.x
                if (pos.y2 > position.bottomright.y) pos.y2 = position.bottomright.y


                if (pos.x1 < position.topleft.x) pos.x1 = position.topleft.x
                if (pos.y1 < position.topleft.y) pos.y1 = position.topleft.y


                if (pos.x1 > position.bottomright.x) pos.x1 = position.bottomright.x
                if (pos.y1 > position.bottomright.y) pos.y1 = position.bottomright.y



                instruction.cords = pos
            }
        }
    }

    // remove every out of bounds
    instructions = instructions.filter(i => i.comment !== 'OUT_OF_BOUNDS')




    /*
    if (this.debug) {
        this.debug.drawnPixels = this.debug.drawnPixels.concat(drawnPixels)



        this.debug.instructionPixels = instructionsToDebug(instructions, position, this.settings.distancing)
        await this.debug.makeImage()
    }
    //*/

    // add onTimeDelay to all instructions

    /*
    if (this.settings.onTimeDelay) {
        for (let i = 0; i < instructions.length; i++) {
            let instruction = instructions[i]
            if (instruction.cords.delay) {
                instruction.cords.delay += this.settings.onTimeDelayMultiplier * i
            }


        }
    }
    //*/


    return instructions

}

function addOnTimeDelay(instructions, settings) {
    if (!settings.onTimeDelay) return instructions
    for (let i = 0; i < instructions.length; i++) {
        let instruction = instructions[i]
        if (instruction.cords.delay) {
            instruction.cords.delay += settings.onTimeDelayMultiplier * i
        }
    }

    return instructions
}


/**
 * @param {DrawInstruction[]} instructions
 * @param {{ topleft: { x: number; y: number; }; }} position
 * @param {number} distancing
 */
function instructionsToDebug(instructions, position, distancing) {
    let debugPixStrings = []
    for (let instruction of instructions) {
        if (instruction.type == 'DRAG') {
            let relative1 = absoluteToRelative(instruction.cords.x1, instruction.cords.y1, position, distancing)
            let relative2 = absoluteToRelative(instruction.cords.x2 ?? 0, instruction.cords.y2 ?? 0, position, distancing)

            let pixString = `${relative1.x}-${relative2.x},${relative1.y}-${relative2.y}`
            debugPixStrings.push(pixString)
        }

    }
    return debugPixStrings
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
function relativeToAbsolute(x, y, position, distancing, xModifyer = 0, yModifyer = 0) {
    return {
        x: (x * distancing) + position.topleft.x + (xModifyer * distancing),
        y: (y * distancing) + position.topleft.y + (yModifyer * distancing)
    }

}

/**
 * @param {number} x
 * @param {number} y
 * @param {{ topleft: { x: number; y: number; }; }} position
 * @param {number} distancing
 * @param {number} xModifyer
 * @param {number} yModifyer
 */
function absoluteToRelative(x, y, position, distancing, xModifyer = 0, yModifyer = 0) {
    return {
        x: (x - position.topleft.x - (xModifyer * distancing)) / distancing,
        y: (y - position.topleft.y - (yModifyer * distancing)) / distancing
    }

}

/**
 * @param {{}} obj
 * @param {string} currentKey
 * @param {string[]} ignoredKeys
 * @returns {string | undefined}
 */
function getNextKey(obj, currentKey, ignoredKeys) {
    // Get an array of the object's keys
    let keys = Object.keys(obj)

    // Filter the keys to exclude the ignored keys
    let filteredKeys = keys.filter(key => !ignoredKeys.includes(key))

    //remove all keys before the current key
    let index = filteredKeys.indexOf(currentKey)
    filteredKeys = filteredKeys.slice(index + 1)

    // Return the next key, or undefined if no key was found
    return filteredKeys[0]
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

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}