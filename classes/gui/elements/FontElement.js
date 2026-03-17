const BaseElement = require("./BaseElement")

module.exports = class FontElement extends BaseElement {
    constructor(font, fontSize = 12) {
        super()
        this.font = font
        this.fontSize = fontSize
    }

    toJSON() {
        return {
            font: this.font + "_" + this.fontSize,
            type: "font"
        }
    }
}