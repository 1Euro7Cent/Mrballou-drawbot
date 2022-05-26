const robot = require('robotjs')

robot.setMouseDelay(0)
module.exports = class DrawInstruction {

    /**
     * @param {"DOT" | "DRAG"} type
     * @param {{x1:number,y1:number, x2?:number, y2?:number, delay?:number}} cords
     * @param {string} comment
     */
    constructor(type, cords, comment) {
        this.type = type
        this.cords = cords
        this.comment = comment
    }

    async execute() {
        // todo: implement with moving mouse
        switch (this.type) {
            case "DOT":
                robot.moveMouse(this.cords.x1, this.cords.y1)
                robot.mouseClick()
                break
            case "DRAG":
                robot.moveMouse(this.cords.x1, this.cords.y1)
                robot.mouseToggle('down')
                robot.moveMouse(this.cords.x2, this.cords.y2)
                robot.mouseToggle('up')
                break
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
