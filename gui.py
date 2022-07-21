from pynput import keyboard
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

sortColAlgs = [
    "size 0-9",
    "size 9-0",
    "name A-Z",
    "name Z-A",
    "random",
    "reverse"
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
            "lineSaving": lineSavingVal.get()
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
    tk.Label(root, text='PlatformText').grid(row=pos["row"], column=pos["col"])
    platform = tk.StringVar(root)
    platforms = getPlatforms(positionData)
    platformOpts = tk.OptionMenu(root, platform, *platforms)
    pos = getRC(guiData, 'platform')
    platformOpts.grid(row=pos["row"], column=pos["col"])

    # speed
    pos = getRC(guiData, 'delayText')
    speedVal = tk.IntVar(root)
    tk.Label(root, text='Delay').grid(row=pos["row"], column=pos["col"])
    speed = tk.Entry(root, textvariable=speedVal)
    pos = getRC(guiData, 'delay')
    speed.grid(row=pos["row"], column=pos["col"])

    # distancing
    pos = getRC(guiData, 'distanceText')
    distanceVal = tk.IntVar(root)
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
    colorDelayVal = tk.IntVar(root)
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


config = {}

with open('config.json', 'r') as f:
    config = json.load(f)

path = config["temp"]+config["abortingFile"]


def keyboardListener():
    with keyboard.Listener(on_press=onPress) as l:

        l.join()


if __name__ == "__main__":
    print("Starting")

    guiThread = threading.Thread(target=main, args=(config['port'],))
    guiThread.daemon = True
    guiThread.start()

    keyboardThread = threading.Thread(target=keyboardListener)
    keyboardThread.daemon = True
    keyboardThread.start()

    while True:
        if not guiThread.is_alive():
            print("GUI thread died... exiting")
            sys.exit()

        if not keyboardThread.is_alive():
            print("keyboard thread died... exiting")
            sys.exit()

        time.sleep(1)
