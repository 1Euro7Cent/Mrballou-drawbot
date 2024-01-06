const BaseElement = require('./elements/BaseElement.js')
const CheckBoxElement = require('./elements/CheckBoxElement.js')
const GeometryElement = require('./elements/GeometryElement.js')
const TextElement = require('./elements/TextElement.js')
const TitleElement = require('./elements/TitleElement.js')
module.exports = class GuiBuilder {
    constructor(metadata) {
        this.metadata = metadata
    }

    /**

     * @returns {{type:string, data:BaseElement[]}}
     */
    #buildMetadata(config) {
        return {
            type: "updateUI",
            data: [
                new GeometryElement("geometry", 400, 200, 300, 300),
                new TitleElement(this.metadata.name)]
        }
    }

    buildSelection(config) {
        let metadata = this.#buildMetadata(config)


        let elements = [
            new TextElement("name", "this is a test"),
            new CheckBoxElement("test", "this is a test button", true)
        ]

        metadata.data = metadata.data.concat(elements)

        // return metadata.replace("{REPLACEME}",
        //     `[${elements.map(e => e.toJSON()).join(",\n")}]`
        // )
        return metadata
    }
    toStr(data) {
        return JSON.stringify(data)
    }
}