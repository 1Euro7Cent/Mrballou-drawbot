const BaseConfig = require("./BaseConfig")

module.exports = class Positions extends BaseConfig {
    constructor(name = 'positions', prettify = false) {
        super(name, prettify)

        /*
        this.data = {
            name: {
                topleft: {
                    x: 0,
                    y: 0
                },
                bottomright: {
                    x: 0,
                    y: 0
                },
                width: 0, // based on the two above
                height: 0,

                colors: {
                    "#000000": {
                        x: 0,
                        y: 0
                    },
                    "#ffffff": {
                        x: 0,
                        y: 0
                    }

                }
            }
        }
        //*/

    }

    /**
     * 
     * @param {any} obj1 the object to check with obj2
     * @param {any} obj2 the object that is the base
     * @returns {boolean} true if obj1 types are the same as obj2
     */
    validateObjectTypes(obj1, obj2) {
        return true

    }

    /**
     * @param {string} platform
     * @returns {{topleft: {x: number, y: number}, bottomright: {x: number, y: number}, width:number, height:number, bucket:{x: number, y:number}, pen:{x:number, y:number} , colors: {hex: {x: number, y: number}}}}
     */
    getPlatform(platform) {
        let width = this.data[platform].bottomright.x - this.data[platform].topleft.x
        let height = this.data[platform].bottomright.y - this.data[platform].topleft.y
        this.data[platform].width = width
        this.data[platform].height = height

        return this.data[platform]

    }
}