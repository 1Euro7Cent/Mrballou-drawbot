const BaseElement = require("./BaseElement.js")
module.exports = class TitleElement extends BaseElement {
    constructor(text) {
        super()
        this.text = text
    }

    toJSON() {
        //     return `{
        //         "text": "${this.text}",
        //         "type": "title"
        //     }`
        // }
        return {
            text: this.text,
            type: "title"
        }
    }


}