const robot = require("robotjs");
const Jimp = require('jimp')
const fs = require('fs')
const mcfsd = require("mcfsd");
const express = require('express')
const resizeImg = require('resize-img');

var port = 1337
var nextline = true
var tries = 0;

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
    //console.log('i got data')
    aborting = false

    fs.unlink('./server/aborting.json', () => { })
    var gui = JSON.parse(fs.readFileSync('./server/gui.json'))
    //console.log(gui)
    response.send({ done: 1 })

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
    var resizing = true



    var platform = gui.platform
    if (typeof config[platform] === 'undefined') return console.error('invalid platform')
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
    retry()
    function retry() {
        tries++
        //download image
        if (resizing) {

            Jimp.read(file, function (err, image) {
                if (typeof image === 'undefined') return console.log('Invalid image provided')
                image.write('./server/images/downloaded_image.png')
                file = './server/images/downloaded_image.png'
            })
        }

        //dither
        Jimp.read(file, function (err, image) {

            robot.setMouseDelay(gui.speed);
            async function dithering(cwidth, cheight) {
                Jimp.read(file, async function (err, image2) {
                    console.log('dithering', file)

                    let ditheredBitmap = await mcfsd(image2.bitmap, ditherAccuracy);
                    //console.log(image.bitmap)

                    let ditheredImage = await Jimp.create(ditheredBitmap);

                    await ditheredImage.writeAsync(`./server/images/dithered_image.png`)
                    setTimeout(() => {


                        file = `./server/images/dithered_image.png`
                        draw(cwidth, cheight, file)
                    }, 100);
                })

            }
            async function resize() {

                console.log('resizing', file)
                var w = Math.round((config[platform].positions.bottomright.x - config[platform].positions.topleft.x) / oneLineIs)
                var h = Math.round((config[platform].positions.bottomright.y - config[platform].positions.topleft.y) / oneLineIs)
                console.log('max dimentions:', w, h)
                //Jimp.read(file, function (err, im) {
                var newWidth, newHeight, tempnewWidth, tempnewHeight, canDraw, type
                async function maxSize(mwidth, mheight, cwidth, cheight) {
                    if (typeof newHeight === 'undefined' || typeof newWidth === 'undefined') {
                        newHeight = cheight
                        newWidth = cwidth
                        tempnewHeight = cheight
                        tempnewWidth = cwidth
                    }
                    if ((cwidth < mwidth) || (cheight < mheight)) {
                        tempnewWidth = Math.round(cwidth * 1.05)
                        tempnewHeight = Math.round(cheight * 1.05)
                        if (tempnewHeight > mheight || tempnewWidth > mwidth) {
                            canDraw = true

                        }
                        else {
                            type = 'max'


                            setTimeout(() => {
                                console.log('resizing to:', tempnewWidth, tempnewHeight, '(maximising)')

                                maxSize(mwidth, mheight, tempnewWidth, tempnewHeight)
                            }, 50);
                        }

                    }
                    //else {

                    if ((cwidth > mwidth) || (cheight > mheight)) {
                        newWidth = Math.round(cwidth / 1.05)
                        newHeight = Math.round(cheight / 1.05)
                        type = 'min'
                        canDraw = false
                        setTimeout(() => {
                            console.log('resizing to:', newWidth, newHeight, '(minimising)')

                            maxSize(mwidth, mheight, newWidth, newHeight)
                        }, 50);

                    }
                    else {
                        //console.log('can draw:', canDraw,'type:', type)
                        if (type === 'min') {
                            canDraw = true
                        }

                    }
                    if (canDraw) {

                        if (file.startsWith('http')) {
                            console.log('retrying')
                            retry()
                            return
                        }
                        else {
                            var newImage = await resizeImg(fs.readFileSync(file), { width: cwidth, height: cheight });



                            fs.writeFileSync('./server/images/resized_image.png', newImage, (err) => {
                                if (err) throw err
                            })
                            file = './server/images/resized_image.png'
                            //setTimeout(() => {

                            if (dither) { dithering(cwidth, cheight) }
                            else {
                                draw(cwidth, cheight, file)
                            }
                            //}, 100);
                        }
                    }


                }

                //}
                maxSize(w, h, image.bitmap.width, image.bitmap.height)
            }
            //return
            resize()



            //})
            //});
        })
    }
    async function draw(cwidth, cheight, file) {

        //console.log('final output:', cwidth, cheight)
        if (file.startsWith('./server/images/downloaded_image.png')) {
            console.log('retrying')
            retry()
            return
        }
        else {
            console.log(`${tries} tries`)
            tries = 0
        }



        //return console.log('drawing now');
        //return console.log('drawing with', file)



        //return



        console.log('i would use', file)
        //return
        Jimp.read(file, function (err, image) {


            //console.log(image)
            //setTimeout(() => {


            robot.moveMouse(config[platform].positions.topleft.x, config[platform].positions.topleft.y)
            setTimeout(() => {

                robot.mouseClick()
            }, 20);

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
            //return
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
                                        }, 20);
                                    }, 20);
                                }, 20);

                            }, 20);
                        }, 20);
                    }, 20);

                }, 20);
                ignoringColors = largest.name

                //return
                setTimeout(() => {
                    console.log(usedColors)

                    function next(a) {

                        for (let y = 0; y < image.bitmap.height; y += accuracy) {
                            if (fs.existsSync('./server/aborting.json')) {
                                aborting = true
                            }
                            for (let x = 0; x < image.bitmap.width; x += accuracy) {
                                if (y >= numOfRows) continue;
                                var color = Jimp.intToRGBA(image.getPixelColor(x, y))
                                var fullHex = fullColorHex(color.r, color.g, color.b)
                                var nearest = nearestColor('#' + fullHex)
                                if (!nextline) {
                                    nextline = true
                                    continue;
                                }
                                if (nearest.value === ignoringColors || aborting) continue;
                                if (nearest.value !== a) continue;
                                var colornext = Jimp.intToRGBA(image.getPixelColor(x + 1, y))
                                var fullHexnext = fullColorHex(colornext.r, colornext.g, colornext.b)
                                var nearestnext = nearestColor('#' + fullHexnext)
                                /*if (nearestnext.value === nearest.value){
                                    robot.moveMouse(mousePos.x + (x * oneLineIs - 1), mousePos.y + (y * oneLineIs - 1))
                                    robot.mouseToggle('down')
                                    robot.dragMouse(mousePos.x + (x * oneLineIs - 1) + 1, mousePos.y + (y * oneLineIs - 1))
                                    robot.mouseToggle('up')
                                    //console.log('draging')
                                    nextline = false
                                }
                                else{*/
                                nextline = true
                                robot.moveMouse(mousePos.x + (x * oneLineIs - 1), mousePos.y + (y * oneLineIs - 1))
                                robot.mouseClick()
                                // }
                            }
                        }

                    }
                    var colors = []
                    for (let o in usedColors) {
                        colors.push(o)
                    }
                    //console.log('colors', colors)
                    var temp = -1
                    function z() {
                        temp++
                        if (temp >= colors.length || aborting) return console.log('Done!!!'), console.log(`
                        *----------------------------*
                        |                            |
                        |   drawbot by mrballou      |   
                        |   support this work        |
                        |   on patreon               |
                        |   patreon.com/mrballou     |
                        |                            |
                        |                            |
                        *----------------------------*`)
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
            }, 200);



            //}, 2500);
        })
    }

})

