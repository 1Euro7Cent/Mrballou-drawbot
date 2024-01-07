const BaseElement = require("./BaseElement")

module.exports = class FontElement extends BaseElement {
    constructor(font) {
        super()
        this.font = font
    }

    toJSON() {
        return {
            font: this.font,
            type: "font"
        }
    }
}