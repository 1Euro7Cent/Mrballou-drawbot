const robot = require("robotjs");
const fs = require('fs')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
var count = 0
readline.question(`What game? `, (w) => {
    readline.close()
    console.log('registred', w)

    setTimeout(() => {

        function a() {
            count++
            fs.readFile('./config.json', (err, data) => {
                data = JSON.parse(data)
                var game = w;
                //console.log(data)



                var pos = robot.getMousePos();
                var color = robot.getPixelColor(pos.x, pos.y);

                if (typeof data[game] === 'undefined') {
                    data[game] = { positions: {}, colors: {} }
                }
                switch (count) {
                    case 1:
                        data[game].positions.pen = {
                            x: pos.x,
                            y: pos.y
                        }
                        break;

                    case 2:
                        data[game].positions.fillbucket = {
                            x: pos.x,
                            y: pos.y
                        }
                        break;

                    default:
                        data[game].colors[count] = `#${color}`;
                        data[game].positions[`#${color}`] = {
                            x: pos.x,
                            y: pos.y
                        }
                }
                fs.writeFile('./config.json', JSON.stringify(data, null, 2), function (err) {
                    if (err) console.log(err)
                })
                console.log(pos.x, pos.y, 'color:', color);

                setTimeout(() => {
                    a()
                }, 1500);
            })
        }
        a()
    }, 3000);
});