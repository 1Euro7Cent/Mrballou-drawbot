const BaseElement = require('./elements/BaseElement.js')
const ButtonElement = require('./elements/ButtonElement.js')
const DropdownElement = require('./elements/DropdownElement.js')
const CheckBoxElement = require('./elements/CheckBoxElement.js')
const EntryElement = require('./elements/EntryElement.js')
const GeometryElement = require('./elements/GeometryElement.js')
const TextElement = require('./elements/TextElement.js')
const TitleElement = require('./elements/TitleElement.js')
const FontElement = require('./elements/FontElement.js')

const Setting = require('./../config/Setting.js')
const Positions = require('./../config/Positions.js')
const Gui = require('./Gui.js')
const Config = require('./../config/Config.js')
module.exports = class GuiBuilder {
    /**
     * @param {import('ws')} ws
     * @param {Config} config
     * @param {import('./../../saves.json')} saves
     */
    constructor(metadata, ws, config, saves) {
        this.metadata = metadata
        this.ws = ws
        this.config = config.data
        this.saves = saves
        // console.log("gui builder", this.config)
    }

    /**

     * @returns {BaseElement[][]}
     */
    #buildMetadata() {
        return [[
            new TextElement(`Version: ${this.metadata.version}`),
            // new GeometryElement(),
            new FontElement(`${this.config.gui.font} ${this.config.gui.fontSize}`),
            new TitleElement(this.metadata.name)]]

    }
    /**
    * @param { Setting } settings
    * @param { Positions } positions
    */
    buildSelection(settings, positions) {
        this.settings = settings.data
        /**
         * @type {string[]}
         */
        this.positions = []

        for (let position in positions.data) {
            this.positions.push(position)
        }
        console.log("buildSelection")
        /**
         * @type {{type: string, data: BaseElement[][]}}
         */
        let data = {
            type: "updateUI",
            data: []
        }
        let saveNames = []
        for (let save in this.saves) {
            saveNames.push(save)
        }

        /**
         * @type {BaseElement[][]}
         */
        let elements = [
            [new TextElement("Platform"), new DropdownElement("platform", this.positions, settings.data.platform)],
            [new TextElement("Delay"), new EntryElement("delay", settings.data.delay)],
            [new TextElement("Distance"), new EntryElement("distancing", settings.data.distancing)],
            [new CheckBoxElement("sortColors", "Sort colors", settings.data.sortColors), new CheckBoxElement("dither", "Dither", settings.data.dither)],
            [new CheckBoxElement("fast", "Fast mode", settings.data.fast), new CheckBoxElement("bucket", "Bucket", settings.data.bucket)],
            [new CheckBoxElement("lineSaving", "Line saving mode", settings.data.lineSaving), new CheckBoxElement("onTimeDelay", "On time delay", settings.data.onTimeDelay)],
            [new CheckBoxElement("dualColorMode", "Dual color mode", settings.data.dualColorMode), new CheckBoxElement("onePassMode", "One pass mode", settings.data.onePassMode)],

            [new TextElement("On time delay multiplier"), new EntryElement("onTimeDelayMultiplier", settings.data.onTimeDelayMultiplier)],
            [new TextElement("Sort colors alg"), new DropdownElement("sortColAlg", [
                "size 0-9",
                "size 9-0",
                "name A-Z",
                "name Z-A",
                "random",
                "reverse"
            ], settings.data.sortColAlg)],
            [new TextElement("Image resize alg"), new DropdownElement("resizeImgAlg", [
                "fit",
                "stretch",
                "cropX",
                "cropY",
                "none"
            ], settings.data.resizeImgAlg)],
            [new TextElement("Position image alg"), new DropdownElement("positionImgAlg", [
                "topLeft",
                "topCenter",
                "topRight",
                "centerLeft",
                "center",
                "centerRight",
                "bottomLeft",
                "bottomCenter",
                "bottomRight"
            ], settings.data.positionImgAlg)],
            // [new TextElement("Dither alg")],
            // [new TextElement("Ignore color"), new EntryElement("ignoreColor", "#FFFFFF")],
            // [new TextElement("Max lines"), new EntryElement("maxLines", "0")],
            [new TextElement("Delay between colors"), new EntryElement("colorDelay", settings.data.colorDelay)],
            [new TextElement("Press delay"), new EntryElement("moveDelay", settings.data.moveDelay)],
            [new ButtonElement("saveConfig", "Save config"), new EntryElement("saveConfigName", "")],
            [new ButtonElement("loadConfig", "Load config"), new DropdownElement("loadConfigName", saveNames, "")],
            [new TextElement("Image URL"), new EntryElement("img", settings.data.img)],
            [new BaseElement(), new ButtonElement("drawButton", "Draw")],
        ]

        let metadata = this.#buildMetadata()
        data.data = elements.concat(metadata)

        // return metadata.replace("{REPLACEME}",
        //     `[${elements.map(e => e.toJSON()).join(",\n")}]`
        // )
        return new Gui(data, this)
    }

    buildCalc(message) {
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
            [new TextElement("Press ESC to abort")],
            [new ButtonElement("abortButton", "Abort/Back")],
            [new TextElement(message)],
        ]

        let metadata = this.#buildMetadata()
        // metadata.push([new GeometryElement(200, 400)])
        data.data = elements.concat(metadata)

        return new Gui(data, this)
    }

    buildMessage(message) {
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
            [new ButtonElement("abortButton", "Back")],
            [new TextElement(message)]
        ]

        let metadata = this.#buildMetadata()
        // metadata.push([new GeometryElement(200, 400)])
        data.data = elements.concat(metadata)

        return new Gui(data, this)

    }
    toStr(data) {
        // console.log(data)
        return JSON.stringify(data)
    }
    serve(gui) {
        let data = this.toStr(gui.elements)
        // console.log("sending data", data)
        this.ws.send(data)
    }
}