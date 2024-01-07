const BaseElement = require("./BaseElement.js")
module.exports = class TextElement extends BaseElement {
    constructor(text) {
        super()
        this.text = text
    }

    toJSON() {
        return {
            text: this.text,
            type: "label"
        }
    }


}