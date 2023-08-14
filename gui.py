from pynput import keyboard, mouse
# import tkinter as tk
import customtkinter as tk
import json
import threading
import sys
import requests
import os
import time

# todo: rewrite this mess

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
            moveDelayVal.set(data['moveDelay'])
            sortColAlg.set(data['sortColAlg'])
            ditherAlg.set(data['ditherAlg'])
            lineSavingVal.set(data['lineSaving'])
            onTimeDelayMultiplyerVal.set(data['onTimeDelayMultiplyer'])
            onTimeDelayVal.set(data['onTimeDelay'])
            imageResizeAlg.set(data['resizeImgAlg'])
            positionImageAlg.set(data['positionImgAlg'])
            dualColorModeVal.set(data['dualColorMode'])
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
            if moveDelayVal.get() == '':
                moveDelayVal.set(1)
        except tk.TclError:
            moveDelayVal.set(1)

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
            "moveDelay": float(moveDelayVal.get()),
            "sortColAlg": sortColAlg.get(),
            "ditherAlg": ditherAlg.get(),
            "lineSaving": lineSavingVal.get(),
            "onTimeDelayMultiplyer": float(onTimeDelayMultiplyerVal.get()),
            "onTimeDelay": onTimeDelayVal.get(),
            "positionOverride": manualOverrideVal,
            "resizeImgAlg": imageResizeAlg.get(),
            "positionImgAlg": positionImageAlg.get(),
            "dualColorMode": dualColorModeVal.get()
        }
        return res

    def saveConfig():
        print('saving configuration')
        data = combineData()
        data["img"] = "" # don't save image path or even worse, the base64 encoded image
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
        if not isServerRunning():
            print('server not running')
            return

        data = combineData()
        with open('settings.json', 'w') as f:
            json.dump(data, f)

        requests.post('http://localhost:' + str(port) + '/draw')

    def isServerRunning():
        try:
            getFromSerer('version')
            return True
        except:
            return False

    def getFromSerer(path):
        print('getting data /' + path +' from server')
        res = requests.get('http://localhost:' + str(port) + '/' + path)
        
        return res.text
    
    versionCode = ""
    try:
        versionCode = getFromSerer('version')
    
    except:
        print('server not running')
        exit()


    
    positionData = getData("positions.json")
    settingsData = getData("settings.json")
    guiData = getData("guiConfig.json")

    root = tk.CTk()
    root.title(getFromSerer('guiName'))
    # root.geometry('200x200')

    pos = {
        "row": -1,
        "col": -1
    }
    # setting platform to draw

    pos = getRC(guiData, 'platformText')
    tk.CTkLabel(root, text='Platform').grid(row=pos["row"], column=pos["col"])
    platform = tk.StringVar(root)
    platforms = getPlatforms(positionData)
    platformOpts = tk.CTkOptionMenu(root, variable=platform, values=platforms)
    pos = getRC(guiData, 'platform')
    platformOpts.grid(row=pos["row"], column=pos["col"])

    # speed
    pos = getRC(guiData, 'delayText')
    speedVal = tk.StringVar(root)
    tk.CTkLabel(root, text='Delay').grid(row=pos["row"], column=pos["col"])
    speed = tk.CTkEntry(root, textvariable=speedVal)
    pos = getRC(guiData, 'delay')
    speed.grid(row=pos["row"], column=pos["col"])

    # distancing
    pos = getRC(guiData, 'distanceText')
    distanceVal = tk.StringVar(root)
    tk.CTkLabel(root, text='Distance').grid(row=pos["row"], column=pos["col"])
    distance = tk.CTkEntry(root, textvariable=distanceVal)
    pos = getRC(guiData, 'distance')
    distance.grid(row=pos["row"], column=pos["col"])

    # checkboxes

    # dualColorMode
    pos = getRC(guiData, 'dualColorMode')
    dualColorModeVal = tk.BooleanVar()
    dualColorMode = tk.CTkCheckBox(root, text='Dual color mode', variable=dualColorModeVal)
    dualColorMode.grid(row=pos["row"], column=pos["col"])



    # sort colors
    pos = getRC(guiData, 'sortColors')
    sortVal = tk.BooleanVar()
    sort = tk.CTkCheckBox(root, text='Sort colors', variable=sortVal)
    sort.grid(row=pos["row"], column=pos["col"])

    # color sort alg
    pos = getRC(guiData, 'sortColorsAlgorithmText')
    tk.CTkLabel(root, text='Sort colors alg').grid(
        row=pos["row"], column=pos["col"])
    sortColAlg = tk.StringVar(root)

    sortColAlgOpts = tk.CTkOptionMenu(root, variable=sortColAlg, values=sortColAlgs)
    pos = getRC(guiData, 'sortColorsAlgorithm')
    sortColAlgOpts.grid(row=pos["row"], column=pos["col"])

    # image resize alg
    pos = getRC(guiData, 'resizeImageAlgorithmText')
    tk.CTkLabel(root, text='Image resize alg').grid(
        row=pos["row"], column=pos["col"])

    imageResizeAlg = tk.StringVar(root)
    imageResizeAlgOpts = tk.CTkOptionMenu(root, variable=imageResizeAlg, values=resizeImgAlgs)
    pos = getRC(guiData, 'resizeImageAlgorithm')
    imageResizeAlgOpts.grid(row=pos["row"], column=pos["col"])

    # position image alg
    pos = getRC(guiData, 'positionImageAlgorithmText')
    tk.CTkLabel(root, text='Position image alg').grid(
        row=pos["row"], column=pos["col"])

    positionImageAlg = tk.StringVar(root)
    positionImageAlgOpts = tk.CTkOptionMenu(
        root, variable=positionImageAlg, values=positionImgAlgs)
    pos = getRC(guiData, 'positionImageAlgorithm')
    positionImageAlgOpts.grid(row=pos["row"], column=pos["col"])

    # dither
    pos = getRC(guiData, 'dither')
    ditherVal = tk.BooleanVar()
    dither = tk.CTkCheckBox(root, text='Dither', variable=ditherVal)
    dither.grid(row=pos["row"], column=pos["col"])

    # dither alg
    pos = getRC(guiData, 'ditherAlgorithmText')
    tk.CTkLabel(root, text='dither alg').grid(
        row=pos["row"], column=pos["col"])
    ditherAlg = tk.StringVar(root)

    ditherAlgOpts = tk.CTkOptionMenu(root, variable=ditherAlg, values=ditherAlgs)
    pos = getRC(guiData, 'ditherAlgorithm')
    ditherAlgOpts.grid(row=pos["row"], column=pos["col"])

    # fast mode
    pos = getRC(guiData, 'fastMode')
    fastVal = tk.BooleanVar()
    fast = tk.CTkCheckBox(root, text='Fast mode', variable=fastVal)
    fast.grid(row=pos["row"], column=pos["col"])

    # line saving mode
    pos = getRC(guiData, 'lineSavingMode')
    lineSavingVal = tk.BooleanVar()
    lineSaving = tk.CTkCheckBox(
        root, text='Line saving mode', variable=lineSavingVal)
    lineSaving.grid(row=pos["row"], column=pos["col"])

    # on time delay
    pos = getRC(guiData, 'onTimeDelayMode')
    onTimeDelayVal = tk.BooleanVar()
    onTimeDelay = tk.CTkCheckBox(
        root, text="on time delay mode", variable=onTimeDelayVal)
    onTimeDelay.grid(row=pos["row"], column=pos["col"])

    # on time delay threshold
    pos = getRC(guiData, 'onTimeDelayText')
    onTimeDelayMultiplyerVal = tk.StringVar(root)
    tk.CTkLabel(root, text='On time delay multiplyer').grid(
        row=pos["row"], column=pos["col"])
    onTimeDelayMultiplyer = tk.CTkEntry(
        root, textvariable=onTimeDelayMultiplyerVal)
    pos = getRC(guiData, 'onTimeDelayMultiplyer')
    onTimeDelayMultiplyer.grid(row=pos["row"], column=pos["col"])

    # bucket
    pos = getRC(guiData, 'bucket')
    bucketVal = tk.BooleanVar()
    bucket = tk.CTkCheckBox(root, text='Bucket', variable=bucketVal)
    bucket.grid(row=pos["row"], column=pos["col"])


    # ignore color
    # todo: add check for valid color
    # todo: add to settings
    pos = getRC(guiData, 'ignoreColorText')
    tk.CTkLabel(root, text='Ignore color').grid(row=pos["row"], column=pos["col"])
    ignore = tk.CTkEntry(root)
    pos = getRC(guiData, 'ignoreColor')
    ignore.grid(row=pos["row"], column=pos["col"])

    # max lines
    pos = getRC(guiData, 'maxLinesText')
    maxLinesVal = tk.IntVar(root)
    tk.CTkLabel(root, text='Max lines').grid(row=pos["row"], column=pos["col"])
    maxLines = tk.CTkEntry(root, textvariable=maxLinesVal)
    pos = getRC(guiData, 'maxLines')
    maxLines.grid(row=pos["row"], column=pos["col"])

    # delay between colors
    pos = getRC(guiData, 'colorDelayText')
    colorDelayVal = tk.StringVar(root)
    tk.CTkLabel(root, text='Delay between colors').grid(
        row=pos["row"], column=pos["col"])
    colorDelay = tk.CTkEntry(root, textvariable=colorDelayVal)
    pos = getRC(guiData, 'colorDelay')
    colorDelay.grid(row=pos["row"], column=pos["col"])

    # moveDelay
    pos = getRC(guiData, 'moveDelayText')
    moveDelayVal = tk.StringVar(root)
    tk.CTkLabel(root, text='Press delay').grid(
        row=pos["row"], column=pos["col"])
    moveDelay = tk.CTkEntry(root, textvariable=moveDelayVal)
    pos = getRC(guiData, 'moveDelay')
    moveDelay.grid(row=pos["row"], column=pos["col"])

    # image
    pos = getRC(guiData, 'imageUrlText')
    imageVal = tk.StringVar(root)
    tk.CTkLabel(root, text='Image URL').grid(row=pos["row"], column=pos["col"])
    image = tk.CTkEntry(root, textvariable=imageVal)
    pos = getRC(guiData, 'imageUrl')
    image.grid(row=pos["row"], column=pos["col"])

    # draw button
    pos = getRC(guiData, 'drawButton')
    tk.CTkButton(root, text='Draw', command=startDraw).grid(
        row=pos["row"], column=pos["col"])

    # save / load configurations
    # save
    # tk.CTkLabel(root, text='Save configuration').grid(row=10, column=0)
    pos = getRC(guiData, 'saveConfigButton')
    saveVal = tk.StringVar(root)
    tk.CTkButton(root, text='Save config',
              command=saveConfig).grid(row=pos["row"], column=pos["col"])
    save = tk.CTkEntry(root, textvariable=saveVal)
    pos = getRC(guiData, 'saveConfig')
    save.grid(row=pos["row"], column=pos["col"])

    # load
    pos = getRC(guiData, 'loadConfigButton')
    tk.CTkButton(root, text='Load config',
              command=lambda: loadData(getSaveData(loadVal.get()))).grid(row=pos["row"], column=pos["col"])

    loadVal = tk.StringVar(root)
    load = tk.CTkOptionMenu(root, variable=loadVal, values=getSaves())
    pos = getRC(guiData, 'loadConfig')
    load.grid(row=pos["row"], column=pos["col"])

    # manual override stuff

    pos = getRC(guiData, 'manualOverrideButton')

    tk.CTkButton(root, text='Manual override', command=lambda: manualOverride()).grid(
        row=pos["row"], column=pos["col"])

    pos = getRC(guiData, 'manualOverrideResetButton')
    tk.CTkButton(root, text='Reset manual override', command=lambda: resetManualOverride(
    )).grid(row=pos["row"], column=pos["col"])

    # version
    version = tk.CTkLabel(root, text="Version: " + versionCode)
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
