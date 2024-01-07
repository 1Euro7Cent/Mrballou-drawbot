const BaseElement = require("./BaseElement.js")
module.exports = class DropdownElement extends BaseElement {
    /**
     * 
     * @param {string} name 
     * @param {string[]} values 
     * @param {string} [selected] current selected value
     */
    constructor(name, values, selected) {
        super()
        this.name = name
        this.values = values
        this.selected = selected
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
            values: this.values,
            selected: this.selected,
            type: "dropdown"
        }
    }


}