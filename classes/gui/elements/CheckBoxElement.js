const BaseElement = require("./BaseElement.js")
module.exports = class CheckBoxElement extends BaseElement {
    constructor(name, text, checked) {
        super()
        this.name = name
        this.text = text
        this.checked = checked
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
            checked: this.checked,
            type: "checkbox"
        }
    }


}