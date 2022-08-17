const BaseConfig = require("./BaseConfig")

module.exports = class GuiConfig extends BaseConfig {
    constructor(name = 'gui', prettify = false) {
        super(name, prettify)

        this.data = [

            ["platformText", "platform"],
            ["delayText", "delay"],
            ["distanceText", "distance"],
            ["sortColors", "dither"],
            ["fastMode", "bucket"],
            ["lineSavingMode", "onTimeDelayMode"],
            ["onTimeDelayText", "onTimeDelayMultiplyer"],
            ["sortColorsAlgorithmText", "sortColorsAlgorithm"],
            ["resizeImageAlgorithmText", "resizeImageAlgorithm"],
            ["positionImageAlgorithmText", "positionImageAlgorithm"],

            ["ditherAlgorithmText", "ditherAlgorithm"],
            ["ignoreColorText", "ignoreColor"],
            ["maxLinesText", "maxLines"],
            ["colorDelayText", "colorDelay"],
            ["saveConfigButton", "saveConfig"],
            ["loadConfigButton", "loadConfig"],
            ["manualOverrideButton", "manualOverrideResetButton"],
            ["imageUrlText", "imageUrl"],
            ["", "drawButton"],

        ]
    }
}