const robot = require('robotjs')

robot.setMouseDelay(0)
module.exports = class DrawInstruction {

    /**
     * @param {"DOT" | "DRAG"| "DRAGNOTRELEASE" | "RELEASE"} type
     * @param {{x1:number,y1:number, x2?:number, y2?:number, delay?:number}} cords
     * @param {"left" | "right" | "middle"} [button]
     * @param {string} [comment]
     */
    constructor(type, cords, button = "left", comment = "none") {
        this.type = type
        this.cords = cords
        this.button = button
        this.comment = comment
    }

    async execute() {
        // @ts-ignore
        if ((isNaN(this.cords.x1) || isNaN(this.cords.y1) || (this.type.includes('DRAG') && (isNaN(this.cords.x2) || isNaN(this.cords.y2))))) {
            console.log(this)
            throw new Error(`Cords are not numbers`)
        }
        if (this.cords.x1 == -1 || this.cords.y1 == -1) return

        switch (this.type) {
            case "DOT":
                if (this.cords.x1 == -1 || this.cords.y1 == -1) break
                robot.moveMouse(this.cords.x1, this.cords.y1)
                robot.mouseClick(this.button)
                break
            case "DRAG":

                if (this.cords.x2 && this.cords.y2) {
                    if (this.cords.x2 == -1 || this.cords.y2 == -1) break
                    robot.moveMouse(this.cords.x1, this.cords.y1)
                    robot.mouseToggle('down', this.button)
                    robot.moveMouse(this.cords.x2, this.cords.y2)
                    robot.mouseToggle('up', this.button)
                }
                break
            case 'DRAGNOTRELEASE':
                if (this.cords.x2 && this.cords.y2) {
                    if (this.cords.x2 == -1 || this.cords.y2 == -1) break

                    robot.moveMouse(this.cords.x1, this.cords.y1)
                    robot.mouseToggle('down', this.button)
                    robot.moveMouse(this.cords.x2, this.cords.y2)
                }
                break
            case 'RELEASE':
                robot.mouseToggle('up', this.button)
                break

            default:
                throw new Error(`Unknown drawinstruction type: ${this.type}`)
        }
        let delay = this.cords.delay ?? 0
        if (delay > 0) {
            await sleep(delay)
        }
    }

}

/**
 * @param {number} ms
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
