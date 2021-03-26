const robot = require("robotjs");
const Jimp = require('jimp')
const DitherJS = require('ditherjs/server');
const hexRgb = require('hex-rgb');
const fs = require('fs')


const config = require('./config.json')

var previusColor = ''


var rgbToHex = function (rgb) {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
var fullColorHex = function (r, g, b) {
    var red = rgbToHex(r);
    var green = rgbToHex(g);
    var blue = rgbToHex(b);
    return red + green + blue;
};


function sortOBJ(obj) {
    var largest = {
        value: 0,
        name: ""
    }
    for (let i in obj) {
        if (largest.value <= obj[i]) {
            largest.value = obj[i]
            largest.name = i
        }
    }
    return largest

}


var platform = 'paint'
var colors = config[platform].colors
var nearestColor = require('nearest-color').from(colors);

var oneColor = true
var fill = true
var ignoringColors = '#ffffff'
var numOfRows = 5000000
var oneLineIs = 2
var aufluesung = 1
var dither = false
//var file = './images/Screenshot_5.png' //backround https://garticphone.com/images/bgcanvas.svg
var file = 'https://cdn.discordapp.com/attachments/512304341844230150/825122061620871209/unknown.png'

var rgbDouble = [[]]
for (let i in colors) {
    var rgb = hexRgb(colors[i])
    rgbDouble[i] = [rgb.red, rgb.green, rgb.blue]
}
rgbDouble.shift()
console.log(rgbDouble)
if (dither) {
    var options = {
        "step": 1, // The step for the pixel quantization n = 1,2,3...
        "palette": rgbDouble, // an array of colors as rgb arrays
        "algorithm": "ordered" // one of ["ordered", "diffusion", "atkinson"]
    }

    var ditherjs = new DitherJS([options]);

    // Get a buffer that can be loaded into a canvas
    var buffer = fs.readFileSync(file);

    ditherjs.dither(buffer, [options]);
}




Jimp.read(file, function (err, image) {
    robot.setMouseDelay(1);

    //console.log(image)
    setTimeout(() => {


        //robot.moveMouse(631, 388)

        //image.getPixelColour
        var mousePos = robot.getMousePos()
        if (!oneColor) {
            for (let y = 0; y < image.bitmap.height; y += oneLineIs) {
                for (let x = 0; x < image.bitmap.width; x += oneLineIs) {
                    if (y >= numOfRows) return;

                    var color = Jimp.intToRGBA(image.getPixelColor(x, y))
                    var fullHex = fullColorHex(color.r, color.g, color.b)
                    var nearest = nearestColor('#' + fullHex)
                    console.log(nearest.value)

                    if (nearest.value === ignoringColors) continue;

                    if (previusColor !== nearest.value) {

                        console.log(nearest.value)
                        robot.moveMouse(config[platform].positions[nearest.value].x, config[platform].positions[nearest.value].y)
                        robot.mouseClick()
                        previusColor = nearest.value
                    }

                    robot.moveMouse(mousePos.x + x, mousePos.y + y)
                    robot.mouseClick()
                }

            }
        }
        else {
            //init colors
            var usedColors = {}
            for (let y = 0; y < image.bitmap.height; y++) {
                for (let x = 0; x < image.bitmap.width; x++) {
                    var color = Jimp.intToRGBA(image.getPixelColor(x, y))
                    var fullHex = fullColorHex(color.r, color.g, color.b)
                    var nearest = nearestColor('#' + fullHex)
                    //console.log(nearest.value)
                    if (typeof usedColors[nearest.value] === 'undefined') {
                        usedColors[nearest.value] = 1
                    }
                    usedColors[nearest.value] = usedColors[nearest.value] + 1
                }
            }
            var largest = sortOBJ(usedColors)
            //draw


            robot.mouseToggle('down')
            robot.moveMouse(mousePos.x, mousePos.y)
            robot.dragMouse(mousePos.x + (image.bitmap.width * oneLineIs), mousePos.y)
            setTimeout(() => {
                robot.dragMouse(mousePos.x + (image.bitmap.width * oneLineIs), mousePos.y + (image.bitmap.height * oneLineIs))
                setTimeout(() => {
                    robot.dragMouse(mousePos.x, mousePos.y + (image.bitmap.height * oneLineIs))
                    setTimeout(() => {
                        robot.dragMouse(mousePos.x, mousePos.y)
                        robot.mouseToggle('up')
                        console.log('is it okay????')
                        setTimeout(() => {








                            robot.moveMouse(config[platform].positions.fillbucket.x, config[platform].positions.fillbucket.y)
                            setTimeout(() => {
                                robot.mouseClick()
                                setTimeout(() => {
                                    robot.moveMouse(config[platform].positions[largest.name].x, config[platform].positions[largest.name].y)
                                    setTimeout(() => {
                                        robot.mouseClick()
                                        setTimeout(() => {
                                            robot.moveMouse(mousePos.x + 3, mousePos.y + 3)
                                            setTimeout(() => {
                                                robot.mouseClick()
                                                setTimeout(() => {
                                                    robot.moveMouse(config[platform].positions.pen.x, config[platform].positions.pen.y)
                                                    setTimeout(() => {
                                                        robot.mouseClick()
                                                    }, 100);
                                                }, 200);
                                            }, 100);

                                        }, 20);
                                    }, 100);
                                }, 100);

                            }, 100);
                            ignoringColors = largest.name














                            setTimeout(() => {



                                console.log(usedColors)
                                for (let a in usedColors) {
                                    console.log(a)
                                    robot.moveMouse(config[platform].positions[a].x, config[platform].positions[a].y)
                                    robot.mouseClick()
                                    previusColor = a
                                    if (usedColors[largest.name] === a) {

                                    }
                                    else {
                                        next()
                                    }

                                    function next() {


                                        for (let y = 0; y < image.bitmap.height; y += aufluesung) {
                                            for (let x = 0; x < image.bitmap.width; x += aufluesung) {
                                                if (y >= numOfRows) continue;
                                                var color = Jimp.intToRGBA(image.getPixelColor(x, y))
                                                var fullHex = fullColorHex(color.r, color.g, color.b)
                                                var nearest = nearestColor('#' + fullHex)
                                                if (nearest.value === ignoringColors) continue;
                                                if (nearest.value !== a) continue;
                                                robot.moveMouse(mousePos.x + (x * oneLineIs - 1), mousePos.y + (y * oneLineIs - 1))
                                                robot.mouseClick()

                                            }
                                        }

                                    }
                                }
                                console.log('Done!!!')
                            }, 1000);
                        }, 3000);
                    }, 20);
                }, 20);
            }, 20);


        }
    }, 3000);
});