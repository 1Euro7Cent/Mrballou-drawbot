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
    console.log('note! to end this just ctrl + c the script')
    console.log('Hover over the top left of the drawing canvas')
    
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
                        data[game].positions.topleft = {
                            x: pos.x,
                            y: pos.y
                        }
                        console.log('hover over the bottom right of the drawing canvas')

                        break;
                        case 2:
                            data[game].positions.bottomright = {
                                x: pos.x,
                                y: pos.y
                            }
                            console.log('hover over the pen')
                            break
                    case 3:
                        data[game].positions.pen = {
                            x: pos.x,
                            y: pos.y
                        }
                        console.log('Hover over the fill bucket')
                        break;
                        
                        case 4:
                            data[game].positions.fillbucket = {
                                x: pos.x,
                                y: pos.y
                            }
                            console.log('Hover over every possible color that the bot can choose')
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
                }, 2000);
            })
        }
        a()
    }, 3000);
});