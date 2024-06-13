
module.exports =
    /**
     * this generates a star text box
     * @param {string} text 
     * @returns {string}
     * @example
     * starBox("hello world")->
     * *-------------*
     * * hello world *
     * *-------------*
     * 
     * starBox("this is a longer text \nwith newlines ")->
     * *-----------------------*
     * * this is a longer text *
     * *     with newlines     *
     * *-----------------------*
     * 
     */
    function starBox(text) {
        let lines = text.split('\n')
        let longest = 0
        for (let line of lines) {
            if (line.length > longest) longest = line.length
        }
        let starLine = "*".repeat(longest + 4)
        let result = starLine + '\n'
        for (let line of lines) {
            let spaces = ' '.repeat((longest - line.length) / 2)
            result += `* ${spaces}${line}${spaces} *\n`
        }
        result += starLine
        return result

    }