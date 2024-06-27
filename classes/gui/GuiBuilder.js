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
     * @type {{resolve: (value: string) => void, reject: (reason?: any) => void, timeoutId: NodeJS.Timeout}}
     */
    #requestcColor
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
        this.isCheckingForUpdates = false
        this.isUpdateAvailable = false
        this.updateCheckFailed = false
        this.checkForUpdates = true
        this.latestVersion = "unknown"
        this.isLatestVersion = false
        this.checkForUpdatesPreRelease = false
        // console.log("gui builder", this.config)
    }
    gotReqCol(color) {
        console.log("clearing timeout")
        clearTimeout(this.#requestcColor.timeoutId)
        this.#requestcColor.resolve(color)
    }

    /**

     * @returns {BaseElement[][]}
     */
    #buildMetadata(type) {
        let versionText = ``
        if (this.isUpdateAvailable || this.isCheckingForUpdates) {
            if (!this.checkForUpdates) {
                versionText += " (update check disabled)"
            } else if (this.updateCheckFailed) {
                versionText += " (update check failed)"

            }
            else if (this.isCheckingForUpdates) {
                versionText += " (checking for updates)"
            }
            else {
                // versionText += ` (latest version: ${this.latestVersion} ${this.checkForUpdatesPreRelease ? "pre-release" : "release"})`
                versionText += ` (Latest: ${this.latestVersion}${this.checkForUpdatesPreRelease ? " pre-release" : ""})`
            }
        }
        else {
            versionText += " (latest version)"
        }

        /**
         * @type {BaseElement[]}
         */
        let textElements = []

        // if (type == "calc") {
        //     textElements.push(new TextElement(`Version: ${this.metadata.version}` + versionText))
        // }
        // else {
        //     textElements.push(new TextElement(`Version: ${this.metadata.version}`), new TextElement(versionText))
        // }

        /**
         * @type {BaseElement[][]}
         */
        let elements = [[
            // new TextElement(`Version: ${this.metadata.version}`), new TextElement(versionText),
            // new GeometryElement(350, 550, -400, 300),
            new FontElement(`${this.config.gui.font} ${this.config.gui.fontSize}`),
            new TitleElement(this.metadata.name)]]
        if (type == "calc") {
            elements.unshift([new TextElement(`Version: ${this.metadata.version}` + versionText)])
        }
        else {
            elements.unshift([new TextElement(`Version: ${this.metadata.version}`), new TextElement(versionText)])
        }

        let geom = this.config.gui.geometry
        let geometry = new GeometryElement()
        if (geom.width != -1) {
            geometry.setWidth(geom.width)
        }
        if (geom.height != -1) {
            geometry.setHeight(geom.height)
        }
        if (geom.x != -1) {
            geometry.setX(geom.x)
        }
        if (geom.y != -1) {
            geometry.setY(geom.y)
        }
        elements[0].push(geometry)
        return elements

    }

    /**
     * @param {BaseElement[][]} elements
     * @param {"updateUI"} type
     * @param {string} [forWhat]
     */
    #insertBase(elements, type, forWhat = "") {
        let metadata = this.#buildMetadata(forWhat)

        let data = {
            type: type,
            data: elements.concat(metadata)
        }
        return new Gui(data, this)
    }

    /**
    * @param { Setting } settings
    * @param { Positions } positions
    */
    buildIgnoreColors(settings, positions) { }

    /**
    * @param { Setting } settings
    * @param { Positions } positions
    */
    buildColorSelector(settings, positions, customText = "") {
        /**
        * @type {BaseElement[][]}
        */
        let elements = [
            [new ButtonElement("abortButton", "Back"), new ButtonElement("transparentPicker", "Select transparent color")],
            // [new TextElement("Note: when bucket is enabled, the bucket will override the ignore colors during the draw")],
            // [new TextElement("Note: when bucket is enabled, the bucket")],
            // [new TextElement("will override the ignore colors during the draw")],

            [new ButtonElement("addIgnoreColor", "Add color"), new ButtonElement("removeIgnoreColor", "Remove selected color")],
        ]
        if (customText != "") {
            elements.push([new TextElement(customText)])
        }
        let c = 0
        for (let color in settings.data.ignoreColors) {
            elements.push([new TextElement(color, color)])
            if (c == 0) {
                let colors = []
                for (let color in settings.data.ignoreColors) {
                    colors.push(color)
                }
                // console.log(colors)
                elements[elements.length - 1].push(new DropdownElement("removeSelectedColor", colors))
            }
            c++
        }


        return this.#insertBase(elements, "updateUI")
    }

    buildTransparentPicker(settings, text = "") {

        let elements = [
            [new ButtonElement("ignoreColorsButton", "Back")],
            [new TextElement("Select a color To be used instead of transparency")],
            text.length > 0 ? [new TextElement(text)] : [],
            [new ButtonElement("requestTransparencyColor", "Select color")],
            [new TextElement("Selected color: "), new TextElement(settings.data.transparentColor, settings.data.transparentColor)],
        ]
        return this.#insertBase(elements, "updateUI")

    }

    /**
     * 
     * @param {*} timeout 
     * @returns {Promise<string>}
     */
    async requestColor(timeout = 60 * 60 * 1000) { // default delay is 1 hour
        let timeoutId = setTimeout(() => {
            this.#requestcColor.reject("request color timed out. the user didn't select a color in time")
        }, timeout)
        return new Promise((resolve, reject) => {
            this.#requestcColor = {
                resolve: resolve,
                reject: reject,
                timeoutId: timeoutId
            }
            let data = {
                type: "requestColor",
                timeout: timeout
            }
            this.ws.send(this.toStr(data))
        }).catch((reason) => {
            console.error(reason)
            new Gui({
                type: "updateUI",
                data: [
                    [new TextElement(`Request color failed for reason: ${reason}`)],
                    [new ButtonElement("abortButton", "Back")],
                ]
            }, this).serve()

        })
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
            [new CheckBoxElement("sortColors", "Sort colors", settings.data.sortColors), new CheckBoxElement("dither", "Dither", settings.data.dither),],
            [new CheckBoxElement("fast", "Fast mode", settings.data.fast), new CheckBoxElement("bucket", "Bucket", settings.data.bucket)],
            [new CheckBoxElement("lineSaving", "Line saving mode", settings.data.lineSaving), new CheckBoxElement("onTimeDelay", "On time delay", settings.data.onTimeDelay)],
            [new CheckBoxElement("dualColorMode", "Dual color mode", settings.data.dualColorMode), new CheckBoxElement("onePassMode", "One pass mode", settings.data.onePassMode)],
            [new CheckBoxElement("box", "Box", settings.data.box),],

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
            [new ButtonElement("ignoreColorsButton", "Ignore colors")],
            [new TextElement("Delay between colors"), new EntryElement("colorDelay", settings.data.colorDelay)],
            [new TextElement("Press delay"), new EntryElement("moveDelay", settings.data.moveDelay)],
            [new ButtonElement("saveConfig", "Save config"), new EntryElement("saveConfigName", "")],
            [new ButtonElement("loadConfig", "Load config"), new DropdownElement("loadConfigName", saveNames, "")],
            [new TextElement("Image URL"), new EntryElement("img", settings.data.img)],
            [new ButtonElement("diagnosticButton", "Make Diagnostics"), new ButtonElement("drawButton", "Draw")],
        ]

        return this.#insertBase(elements, "updateUI")
    }

    buildCalc(message) {
        /**
         * @type {{type: string, data: BaseElement[][]}}
         */
        // let data = {
        //     type: "updateUI",
        //     data: []
        // }

        /**
         * @type {BaseElement[][]}
         */
        let elements = [
            [new TextElement("Press ESC to abort")],
            [new ButtonElement("abortButton", "Abort/Back")],
            [new TextElement(message)],
        ]

        // let metadata = this.#buildMetadata()
        // // metadata.push([new GeometryElement(200, 400)])
        // data.data = elements.concat(metadata)

        // return new Gui(data, this)
        return this.#insertBase(elements, "updateUI", "calc")
    }


    buildMessage(message, noAbort = false) {
        /**
         * @type {BaseElement[][]}
         */
        let elements = [
            [(!noAbort) ? new ButtonElement("abortButton", "Back") : new TextElement("Restart required")],
            [new TextElement(message)]
        ]

        return this.#insertBase(elements, "updateUI")

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