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

     * @returns {BaseElement[][]}
     */
    #buildMetadata(config) {
        return [[
            new GeometryElement("geometry", 400, 200, 300, 300),
            new TitleElement(this.metadata.name)]]

    }

    buildSelection(config) {
        /**
         * @type {{type: string, data: BaseElement[][]}}
         */
        let data = {
            type: "updateUI",
            data: []
        }

        /**
         * @type {BaseElement[][]}
         */
        let elements = [
            [new TextElement("name", "first text"), new TextElement("name2", "second text")],
            [new CheckBoxElement("test", "tcheckbox", true)]
        ]

        let metadata = this.#buildMetadata(config)
        data.data = elements.concat(metadata)

        // return metadata.replace("{REPLACEME}",
        //     `[${elements.map(e => e.toJSON()).join(",\n")}]`
        // )
        return data
    }
    toStr(data) {
        return JSON.stringify(data)
    }
}