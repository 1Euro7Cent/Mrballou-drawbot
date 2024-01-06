const BaseElement = require("./BaseElement")

module.exports = class GeometryElement extends BaseElement {
    /**
     * @param {string} name
     * @param {number} width
     * @param {number} height
     * @param {number} [x]
     * @param {number} [y]
     */
    constructor(name, width, height, x, y) {
        super()
        this.name = name
        this.width = width
        this.height = height
        this.x = x
        this.y = y
    }

    toJSON() {
        return {
            name: this.name,
            width: this.width,
            height: this.height,
            x: this.x,
            y: this.y,
            type: "geometry"
        }
    }
}