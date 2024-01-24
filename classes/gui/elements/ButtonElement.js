const BaseElement = require("./BaseElement.js")
module.exports = class ButtonElement extends BaseElement {
    constructor(name, text) {
        super()
        this.name = name
        this.text = text
    }

    toJSON() {
        // return `{
        //     "name": "${this.name}",
        //     "text": "${this.text}",
        //     "checked": ${this.checked},
        //     "type": "checkbox"
        // }`
        return {
            name: this.name,
            text: this.text,
            type: "button"
        }
    }


}