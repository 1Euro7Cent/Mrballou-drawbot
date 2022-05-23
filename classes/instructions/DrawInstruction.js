const robot = require('robotjs')

robot.setMouseDelay(1)
module.exports = class DrawInstruction {

    /**
     * @param {"DOT" | "DRAG"} type
     * @param {{x1:number,y1:number, x2?:number, y2?:number, speed?:number}} cords
     * @param {string} comment
     */
    constructor(type, cords, comment) {
        this.type = type
        this.cords = cords
        this.comment = comment
    }

    execute() {
        // todo: implement with moving mouse
        switch (this.type) {
            case "DOT":
                robot.moveMouse(this.cords.x1, this.cords.y1)
                robot.mouseClick()
                break
        }
    }

}
