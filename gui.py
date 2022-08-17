from pynput import keyboard, mouse
import tkinter as tk
import json
import threading
import sys
import requests
import os
import time

projectData = {}
positionData = {}
settingsData = {}
guiData = {}

requestingManualOverride = False
manualOverrideVal = {
    "enabled": False,
    "x1": -1,
    "y1": -1,
    "x2": -1,
    "y2": -1
}


sortColAlgs = [
    "size 0-9",
    "size 9-0",
    "name A-Z",
    "name Z-A",
    "random",
    "reverse"
]

resizeImgAlgs = [
    "fit",
    "stretch",
    "cropX",
    "cropY",
    "none"
]

positionImgAlgs = [
    "topLeft",
    "topCenter",
    "topRight",
    "centerLeft",
    "center",
    "centerRight",
    "bottomLeft",
    "bottomCenter",
    "bottomRight"
]

ditherAlgs = [
    "Floyd-Steinberg",
]


def getData(file):
    print('reading data from ' + file)
    if os.path.exists(file):
        with open(file, "r") as f:
            return json.load(f)
    return {}


def getRC(data, name):
    i = 0
    j = 0
    for row in data:
        j = 0
        for col in row:
            if col == name:
                return {
                    "row": i,
                    "col": j
                }
            j += 1
        i += 1

    return{
        "row": -1,
        "col": -1
    }


def getPlatforms(data):
    res = []
    for platform in data:
        res.append(platform)
    return res


def manualOverride():
    print("Manual override")
    global requestingManualOverride
    global manualOverrideVal
    manualOverrideVal = {
        "enabled": True,
        "x1": -1,
        "y1": -1,
        "x2": -1,
        "y2": -1
    }
    requestingManualOverride = True
    print(manualOverrideVal)


def resetManualOverride():
    global manualOverrideVal
    manualOverrideVal = {
        "enabled": False,
        "x1": -1,
        "y1": -1,
        "x2": -1,
        "y2": -1
    }
    print(manualOverrideVal)


def main(port):

    def loadData(data):
        try:
            platform.set(data['name'])
            imageVal.set(data['img'])
            speedVal.set(data['delay'])
            distanceVal.set(data['distancing'])
            sortVal.set(data['sortColors'])
            ditherVal.set(data['dither'])
            fastVal.set(data['fast'])
            bucketVal.set(data['bucket'])
            maxLinesVal.set(data['maxLines'])
            colorDelayVal.set(data['colorDelay'])
            sortColAlg.set(data['sortColAlg'])
            ditherAlg.set(data['ditherAlg'])
            lineSavingVal.set(data['lineSaving'])
            onTimeDelayMultiplyerVal.set(data['onTimeDelayMultiplyer'])
            onTimeDelayVal.set(data['onTimeDelay'])
            imageResizeAlg.set(data['resizeImgAlg'])
            positionImageAlg.set(data['positionImgAlg'])
        except KeyError:
            print("Error loading data")
        checkData()
        print('data loaded')

    def checkData():
        try:
            if speedVal.get() == '':
                speedVal.set(1)
        except tk.TclError:
            speedVal.set(1)

        try:
            if distanceVal.get() == '':
                distanceVal.set(1)
        except tk.TclError:
            distanceVal.set(1)

        try:
            if maxLinesVal.get() == '':
                maxLinesVal.set(999999)
        except tk.TclError:
            maxLinesVal.set(999999)

        try:
            if colorDelayVal.get() == '':
                colorDelayVal.set(1)
        except tk.TclError:
            colorDelayVal.set(1)

        try:
            if onTimeDelayMultiplyerVal.get() == '':
                onTimeDelayMultiplyerVal.set(0)
        except tk.TclError:
            onTimeDelayMultiplyerVal.set(0)

        try:
            if imageResizeAlg.get() == '':
                imageResizeAlg.set(resizeImgAlgs[0])
        except tk.TclError:
            imageResizeAlg.set(resizeImgAlgs[0])

        try:
            if positionImageAlg.get() == '':
                positionImageAlg.set(positionImgAlgs[0])
        except tk.TclError:
            positionImageAlg.set(positionImgAlgs[0])

    def combineData():
        checkData()
        res = {
            "name": platform.get(),
            "img": imageVal.get(),
            "delay": float(speedVal.get()),
            "distancing": float(distanceVal.get()),
            "sortColors": sortVal.get(),
            "dither": ditherVal.get(),
            "fast": fastVal.get(),
            "bucket": bucketVal.get(),
            "maxLines": int(maxLinesVal.get()),
            "colorDelay": float(colorDelayVal.get()),
            "sortColAlg": sortColAlg.get(),
            "ditherAlg": ditherAlg.get(),
            "lineSaving": lineSavingVal.get(),
            "onTimeDelayMultiplyer": float(onTimeDelayMultiplyerVal.get()),
            "onTimeDelay": onTimeDelayVal.get(),
            "positionOverride": manualOverrideVal,
            "resizeImgAlg": imageResizeAlg.get(),
            "positionImgAlg": positionImageAlg.get()
        }
        return res

    def saveConfig():
        print('saving configuration')
        data = combineData()
        name = saveVal.get()

        if name == '':
            print('no name given')
            return

        jsonData = {}
        if os.path.exists('saves.json'):
            with open('saves.json', 'r') as f:
                jsonData = json.load(f)

        jsonData[name] = data

        with open('saves.json', 'w') as f:
            json.dump(jsonData, f)
        saveVal.set('')

        # todo: update content of option menu to load new save/config

    def getSaves():
        print('getting saves')
        saves = []
        if os.path.exists('saves.json'):
            with open('saves.json', 'r') as f:
                jsonData = json.load(f)
                for key in jsonData:
                    saves.append(key)
        if len(saves) == 0:
            saves.append('')
        return saves

    def getSaveData(name):
        print('getting save data')
        if os.path.exists('saves.json'):
            with open('saves.json', 'r') as f:
                jsonData = json.load(f)
                return jsonData[name]
        return {}

    def startDraw():
        print('starting draw')

        data = combineData()
        with open('settings.json', 'w') as f:
            json.dump(data, f)

        requests.post('http://localhost:' + str(port) + '/draw')

    projectData = getData("package.json")
    positionData = getData("positions.json")
    settingsData = getData("settings.json")
    guiData = getData("guiConfig.json")

    root = tk.Tk()
    root.title(projectData['name'])
    # root.geometry('200x200')

    pos = {
        "row": -1,
        "col": -1
    }
    # setting platform to draw

    pos = getRC(guiData, 'platformText')
    tk.Label(root, text='Platform').grid(row=pos["row"], column=pos["col"])
    platform = tk.StringVar(root)
    platforms = getPlatforms(positionData)
    platformOpts = tk.OptionMenu(root, platform, *platforms)
    pos = getRC(guiData, 'platform')
    platformOpts.grid(row=pos["row"], column=pos["col"])

    # speed
    pos = getRC(guiData, 'delayText')
    speedVal = tk.StringVar(root)
    tk.Label(root, text='Delay').grid(row=pos["row"], column=pos["col"])
    speed = tk.Entry(root, textvariable=speedVal)
    pos = getRC(guiData, 'delay')
    speed.grid(row=pos["row"], column=pos["col"])

    # distancing
    pos = getRC(guiData, 'distanceText')
    distanceVal = tk.StringVar(root)
    tk.Label(root, text='Distance').grid(row=pos["row"], column=pos["col"])
    distance = tk.Entry(root, textvariable=distanceVal)
    pos = getRC(guiData, 'distance')
    distance.grid(row=pos["row"], column=pos["col"])

    # checkboxes

    # sort colors
    pos = getRC(guiData, 'sortColors')
    sortVal = tk.BooleanVar()
    sort = tk.Checkbutton(root, text='Sort colors', variable=sortVal)
    sort.grid(row=pos["row"], column=pos["col"])

    # color sort alg
    pos = getRC(guiData, 'sortColorsAlgorithmText')
    tk.Label(root, text='Sort colors alg').grid(
        row=pos["row"], column=pos["col"])
    sortColAlg = tk.StringVar(root)

    sortColAlgOpts = tk.OptionMenu(root, sortColAlg, *sortColAlgs)
    pos = getRC(guiData, 'sortColorsAlgorithm')
    sortColAlgOpts.grid(row=pos["row"], column=pos["col"])

    # image resize alg
    pos = getRC(guiData, 'resizeImageAlgorithmText')
    tk.Label(root, text='Image resize alg').grid(
        row=pos["row"], column=pos["col"])

    imageResizeAlg = tk.StringVar(root)
    imageResizeAlgOpts = tk.OptionMenu(root, imageResizeAlg, *resizeImgAlgs)
    pos = getRC(guiData, 'resizeImageAlgorithm')
    imageResizeAlgOpts.grid(row=pos["row"], column=pos["col"])

    # position image alg
    pos = getRC(guiData, 'positionImageAlgorithmText')
    tk.Label(root, text='Position image alg').grid(
        row=pos["row"], column=pos["col"])

    positionImageAlg = tk.StringVar(root)
    positionImageAlgOpts = tk.OptionMenu(
        root, positionImageAlg, *positionImgAlgs)
    pos = getRC(guiData, 'positionImageAlgorithm')
    positionImageAlgOpts.grid(row=pos["row"], column=pos["col"])

    # dither
    pos = getRC(guiData, 'dither')
    ditherVal = tk.BooleanVar()
    dither = tk.Checkbutton(root, text='Dither', variable=ditherVal)
    dither.grid(row=pos["row"], column=pos["col"])

    # dither alg
    pos = getRC(guiData, 'ditherAlgorithmText')
    tk.Label(root, text='dither alg').grid(
        row=pos["row"], column=pos["col"])
    ditherAlg = tk.StringVar(root)

    ditherAlgOpts = tk.OptionMenu(root, ditherAlg, *ditherAlgs)
    pos = getRC(guiData, 'ditherAlgorithm')
    ditherAlgOpts.grid(row=pos["row"], column=pos["col"])

    # fast mode
    pos = getRC(guiData, 'fastMode')
    fastVal = tk.BooleanVar()
    fast = tk.Checkbutton(root, text='Fast mode', variable=fastVal)
    fast.grid(row=pos["row"], column=pos["col"])

    # line saving mode
    pos = getRC(guiData, 'lineSavingMode')
    lineSavingVal = tk.BooleanVar()
    lineSaving = tk.Checkbutton(
        root, text='Line saving mode', variable=lineSavingVal)
    lineSaving.grid(row=pos["row"], column=pos["col"])

    # on time delay
    pos = getRC(guiData, 'onTimeDelayMode')
    onTimeDelayVal = tk.BooleanVar()
    onTimeDelay = tk.Checkbutton(
        root, text="on time delay mode", variable=onTimeDelayVal)
    onTimeDelay.grid(row=pos["row"], column=pos["col"])

    # on time delay threshold
    pos = getRC(guiData, 'onTimeDelayText')
    onTimeDelayMultiplyerVal = tk.StringVar(root)
    tk.Label(root, text='On time delay multiplyer').grid(
        row=pos["row"], column=pos["col"])
    onTimeDelayMultiplyer = tk.Entry(
        root, textvariable=onTimeDelayMultiplyerVal)
    pos = getRC(guiData, 'onTimeDelayMultiplyer')
    onTimeDelayMultiplyer.grid(row=pos["row"], column=pos["col"])

    # bucket
    pos = getRC(guiData, 'bucket')
    bucketVal = tk.BooleanVar()
    bucket = tk.Checkbutton(root, text='Bucket', variable=bucketVal)
    bucket.grid(row=pos["row"], column=pos["col"])

    # todo: dither algorithm

    # ignore color
    # todo: add check for valid color
    # todo: add to settings
    pos = getRC(guiData, 'ignoreColorText')
    tk.Label(root, text='Ignore color').grid(row=pos["row"], column=pos["col"])
    ignore = tk.Entry(root)
    pos = getRC(guiData, 'ignoreColor')
    ignore.grid(row=pos["row"], column=pos["col"])

    # max lines
    pos = getRC(guiData, 'maxLinesText')
    maxLinesVal = tk.IntVar(root)
    tk.Label(root, text='Max lines').grid(row=pos["row"], column=pos["col"])
    maxLines = tk.Entry(root, textvariable=maxLinesVal)
    pos = getRC(guiData, 'maxLines')
    maxLines.grid(row=pos["row"], column=pos["col"])

    # delay between colors
    pos = getRC(guiData, 'colorDelayText')
    colorDelayVal = tk.StringVar(root)
    tk.Label(root, text='Delay between colors').grid(
        row=pos["row"], column=pos["col"])
    colorDelay = tk.Entry(root, textvariable=colorDelayVal)
    pos = getRC(guiData, 'colorDelay')
    colorDelay.grid(row=pos["row"], column=pos["col"])

    # image
    pos = getRC(guiData, 'imageUrlText')
    imageVal = tk.StringVar(root)
    tk.Label(root, text='Image URL').grid(row=pos["row"], column=pos["col"])
    image = tk.Entry(root, textvariable=imageVal)
    pos = getRC(guiData, 'imageUrl')
    image.grid(row=pos["row"], column=pos["col"])

    # draw button
    pos = getRC(guiData, 'drawButton')
    tk.Button(root, text='Draw', command=startDraw).grid(
        row=pos["row"], column=pos["col"])

    # save / load configurations
    # save
    # tk.Label(root, text='Save configuration').grid(row=10, column=0)
    pos = getRC(guiData, 'saveConfigButton')
    saveVal = tk.StringVar(root)
    tk.Button(root, text='Save config',
              command=saveConfig).grid(row=pos["row"], column=pos["col"])
    save = tk.Entry(root, textvariable=saveVal)
    pos = getRC(guiData, 'saveConfig')
    save.grid(row=pos["row"], column=pos["col"])

    # load
    pos = getRC(guiData, 'loadConfigButton')
    tk.Button(root, text='Load config',
              command=lambda: loadData(getSaveData(loadVal.get()))).grid(row=pos["row"], column=pos["col"])

    loadVal = tk.StringVar(root)
    load = tk.OptionMenu(root, loadVal, *getSaves())
    pos = getRC(guiData, 'loadConfig')
    load.grid(row=pos["row"], column=pos["col"])

    # manual override stuff

    pos = getRC(guiData, 'manualOverrideButton')

    tk.Button(root, text='Manual override', command=lambda: manualOverride()).grid(
        row=pos["row"], column=pos["col"])

    pos = getRC(guiData, 'manualOverrideResetButton')
    tk.Button(root, text='Reset manual override', command=lambda: resetManualOverride(
    )).grid(row=pos["row"], column=pos["col"])

    # version
    version = tk.Label(root, text="Version: " + projectData["version"])
    version.grid()

    loadData(settingsData)
    root.mainloop()


def onPress(key):
    if key == keyboard.Key.esc or key == keyboard.KeyCode.from_char(config['abortKey']):
        print("Aborting")
        # create a new json file
        with open(path, 'w') as f:
            json.dump({"abort": True}, f)


def onClick(x, y, button, pressed):
    global manualOverrideVal
    global requestingManualOverride
    if requestingManualOverride and pressed and button == mouse.Button.left:
        print("Manual overrise pressed at {} {}".format(x, y))

       # if x1 and y1 are not set, set them to the current position
       # the same for x2 and y2 but with the next click
        if manualOverrideVal["x1"] < 0 or manualOverrideVal["y1"] < 0:
            manualOverrideVal["x1"] = x
            manualOverrideVal["y1"] = y
        else:

            if manualOverrideVal["x2"] < 0 or manualOverrideVal["y2"] < 0:
                manualOverrideVal["x2"] = x
                manualOverrideVal["y2"] = y
                requestingManualOverride = False

                print(manualOverrideVal)


config = {}

with open('config.json', 'r') as f:
    config = json.load(f)

path = config["temp"]+config["abortingFile"]


def keyboardListener():
    with keyboard.Listener(on_press=onPress) as l:

        l.join()


def mouseListener():
    with mouse.Listener(on_click=onClick) as l:
        l.join()


if __name__ == "__main__":
    print("Starting")

    guiThread = threading.Thread(target=main, args=(config['port'],))
    guiThread.daemon = True
    guiThread.start()

    keyboardThread = threading.Thread(target=keyboardListener)
    keyboardThread.daemon = True
    keyboardThread.start()

    mouseThread = threading.Thread(target=mouseListener)
    mouseThread.daemon = True
    mouseThread.start()

    while True:
        if not guiThread.is_alive():
            print("GUI thread died... exiting")
            sys.exit()

        if not keyboardThread.is_alive():
            print("keyboard thread died... exiting")
            sys.exit()

        if not mouseThread.is_alive():
            print("mouse thread died... exiting")
            sys.exit()

        time.sleep(1)
