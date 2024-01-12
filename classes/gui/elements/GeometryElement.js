const BaseElement = require("./BaseElement")

module.exports = class GeometryElement extends BaseElement {

    constructor() {
        super()
        this.width = null
        this.height = null
        this.x = null
        this.y = null
    }

    /**
     * @param {number} width
     * @returns {GeometryElement}
     */
    setWidth(width) {
        this.width = width
        return this
    }

    /**
     * @param {number} height
     * @returns {GeometryElement}
     */
    setHeight(height) {
        this.height = height
        return this
    }

    /**
     * @param {number} x
     * @returns {GeometryElement}
     */
    setX(x) {
        this.x = x
        return this
    }

    /**
     * @param {number} y
     * @returns {GeometryElement}
     */
    setY(y) {
        this.y = y
        return this
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