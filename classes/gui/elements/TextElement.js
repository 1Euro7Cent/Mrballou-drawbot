const BaseElement = require("./BaseElement.js")
module.exports = class TextElement extends BaseElement {
    constructor(text, color) {
        super()
        this.text = text
        this.color = color
    }

    toJSON() {
        return {
            text: this.text,
            color: this.color,
            type: "label"
        }
    }


}