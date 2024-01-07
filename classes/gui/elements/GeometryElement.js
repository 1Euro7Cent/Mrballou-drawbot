const BaseElement = require("./BaseElement")

module.exports = class GeometryElement extends BaseElement {
    /**
     * @param {number} width
     * @param {number} height
     * @param {number} [x]
     * @param {number} [y]
     */
    constructor(width, height, x, y) {
        super()
        this.width = width
        this.height = height
        this.x = x
        this.y = y
    }

    toJSON() {
        return {
            width: this.width,
            height: this.height,
            x: this.x,
            y: this.y,
            type: "geometry"
        }
    }
}