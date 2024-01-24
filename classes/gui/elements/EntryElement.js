const BaseElement = require("./BaseElement.js")
module.exports = class EntryElement extends BaseElement {
    constructor(name, content) {
        super()
        this.name = name
        this.content = content
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
            content: this.content,
            type: "entry"
        }
    }


}