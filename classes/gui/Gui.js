module.exports = class Gui {
    /**
     * @param {{type: string, data: import('./elements/BaseElement')[][]}} elements
     * @param {import('./GuiBuilder')} guiBuilder
     */
    constructor(elements, guiBuilder) {
        this.elements = elements
        this.guiBuilder = guiBuilder
    }
    serve() {
        this.guiBuilder.serve(this)
    }
}