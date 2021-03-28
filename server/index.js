const robot = require("robotjs");
const Jimp = require('jimp')
const fs = require('fs')
const mcfsd = require("mcfsd");
const express = require('express')

var port = 1337

const app = express()
app.listen(port, () => { console.log('listining on', port) })
app.use(express.static('public'))



const config = require('./config.json');


var aborting = false


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
function sortOBJBySize(obj) {
    var sortable = [];
    for (var i in obj) {
        sortable.push([i, obj[i]]);
    }

    sortable.sort(function (a, b) {
        return a[1] - b[1];
    });
    var objSorted = {}
    sortable.forEach(function (item) {
        objSorted[item[0]] = item[1]
    })
    return objSorted
}


app.get('/draw', (request, response) => {
    console.log('i got data')
    aborting = false

    fs.unlink('./server/aborting.json', () => { console.log('aborting aborted') })
    var gui = JSON.parse(fs.readFileSync('./server/gui.json'))
    console.log(gui)

    if (gui.dither === 1) {
        var dither = true
    }
    else {
        var dither = false
    }
    if (gui.box === 1) {
        var box = true
    }
    else {
        var box = false
    }


    var platform = gui.platform
    var colors = config[platform].colors
    var nearestColor = require('nearest-color').from(colors);

    var ignoringColors = ''
    var numOfRows = gui.totallines
    var oneLineIs = gui.oneLineIs // every x pixels in the painting programm a pixel of the original will be painted
    var accuracy = gui.accuracy // more meany less
    var delayBetweenColors = gui.delayBetweenColors

    var ditherAccuracy = gui.ditherAccuracy
    //var file = './images/piano.jpg' //backround https://garticphone.com/images/bgcanvas.svg
    var file = gui.image
    response.send({ done: 1 })



    Jimp.read(file, function (err, image) {
        robot.setMouseDelay(gui.speed);
        if (dither) {
            async function dithering() {

                let ditheredBitmap = await mcfsd(image.bitmap, ditherAccuracy);
                //console.log(image.bitmap)

                let ditheredImage = await Jimp.create(ditheredBitmap);

                await ditheredImage.writeAsync(`./server/images/dithered_image.png`);
                file = `./server/images/dithered_image.png`
            }
            dithering()
        }
        setTimeout(() => {


            console.log('i would use', file)
            //return
            Jimp.read(file, function (err, image) {

                //console.log(image)
                setTimeout(() => {


                    //robot.moveMouse(631, 388)

                    //image.getPixelColour
                    var mousePos = robot.getMousePos()

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
                    usedColors = sortOBJBySize(usedColors)
                    //draw

                    console.log(file)
                    console.log(platform)
                    console.log('is it okay????')
                    if (box) {
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

                                }, 20);
                            }, 20);
                        }, 20);
                    }


                    setTimeout(() => {








                        robot.moveMouse(config[platform].positions.fillbucket.x, config[platform].positions.fillbucket.y)
                        setTimeout(() => {
                            robot.mouseClick()
                            setTimeout(() => {
                                robot.moveMouse(config[platform].positions[largest.name].x, config[platform].positions[largest.name].y)
                                setTimeout(() => {
                                    robot.mouseClick()
                                    setTimeout(() => {
                                        robot.moveMouse(mousePos.x + 10, mousePos.y + 10)
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
                            function next(a) {

                                for (let y = 0; y < image.bitmap.height; y += accuracy) {
                                    for (let x = 0; x < image.bitmap.width; x += accuracy) {
                                        if (y >= numOfRows) continue;
                                        var color = Jimp.intToRGBA(image.getPixelColor(x, y))
                                        var fullHex = fullColorHex(color.r, color.g, color.b)
                                        var nearest = nearestColor('#' + fullHex)
                                        if (nearest.value === ignoringColors || aborting) continue;
                                        if (nearest.value !== a) continue;

                                        try {
                                            if (fs.existsSync('./server/aborting.json')) {
                                                aborting = true
                                            }
                                        } catch (err) {
                                            console.error(err)
                                        }
                                        //console.log(aborting)
                                        robot.moveMouse(mousePos.x + (x * oneLineIs - 1), mousePos.y + (y * oneLineIs - 1))
                                        robot.mouseClick()

                                    }
                                }

                            }
                            var colors = []
                            for (let o in usedColors) {
                                colors.push(o)
                            }
                            var temp = 0
                            function z() {
                                temp++
                                if (temp >= colors.length) return console.log('Done!!!')
                                console.log(colors[temp])
                                robot.moveMouse(config[platform].positions[colors[temp]].x, config[platform].positions[colors[temp]].y)
                                robot.mouseClick()
                                previusColor = colors[temp]
                                if (usedColors[largest.name] === colors[temp]) { }
                                else {
                                    next(colors[temp])
                                    if (aborting) {
                                        z()
                                    }
                                    else {
                                        setTimeout(() => {
                                            z()
                                        }, delayBetweenColors);
                                    }
                                }
                            }
                            z()
                            //console.log('Done!!!')
                        }, 1000);
                    }, 3000);



                }, 2500);
            })
        }, 100);
    })

})