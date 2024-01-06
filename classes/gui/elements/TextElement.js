const BaseElement = require("./BaseElement.js")
module.exports = class TextElement extends BaseElement {
    constructor(name, text) {
        super()
        this.name = name
        this.text = text
    }

    toJSON() {
        return {
            name: this.name,
            text: this.text,
            type: "label"
        }
    }


}