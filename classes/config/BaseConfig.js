const fs = require('fs')

module.exports = class Config {
    /**
     * 
     * @param {string} name 
     * @param {boolean} prettify 
     * @param {boolean} allowParseToNumber 
     */
    constructor(name = 'config', prettify = false, allowParseToNumber = true) {

        this.data = {}
        this.name = name
        this.prettify = prettify
        this.allowParseToNumber = allowParseToNumber
    }
    /**
     * @param {any} config
     * @returns {boolean} true if all keys and values are of the correct type
     */
    validateTypes(config) {
        return this.validateObjectTypes(config, this.data)
    }
    /**
     * 
     * @param {any} obj1 the object to check with obj2
     * @param {any} obj2 the object that is the base
     * @returns {boolean} true if obj1 types are the same as obj2
     */
    validateObjectTypes(obj1, obj2) {
        for (let key in obj1) {
            if (typeof obj2[key] != 'undefined') {
                if (typeof obj1[key] == 'object') {
                    if (!this.validateObjectTypes(obj1[key], obj2[key])) {
                        return false
                    }
                }
                else {

                    if (typeof obj1[key] !== typeof obj2[key]) {
                        if (this.allowParseToNumber && typeof obj1[key] == 'string' && typeof obj2[key] == 'number') {
                            obj1[key] = Number(obj1[key])
                            continue
                        }
                        throw new Error(`${this.name} key ${key} is not of type ${typeof obj2[key]}`)
                    }
                }
            }
            else {
                console.warn(`${this.name} key ${key} is not defined in the ${this.name} as a default value`)
            }
        }
        return true

    }
    /**
     * this overwrites the internal config object with the given config file
     * @param {string} file
     */
    fromFile(file) {
        if (!fs.existsSync(file)) {

            this.save(file)
        }
        let data = fs.readFileSync(file).toString()
        let config = JSON.parse(data)
        return this.fromJson(config)

    }
    /**
     * this overwrites the internal config object with the given config object
     * @param {{any: any}} json
     */
    fromJson(json) {
        let newConfig = {}
        for (let key in json) {
            newConfig[key] = json[key]
        }
        if (this.validateTypes(newConfig)) {

            for (let key in newConfig) {
                this.data[key] = newConfig[key]
            }
            return this.data
        }
    }

    /**
     * @param {fs.PathOrFileDescriptor} file
     */
    save(file) {
        fs.writeFileSync(file, JSON.stringify(this.data, null, this.prettify ? 2 : undefined))
    }
}