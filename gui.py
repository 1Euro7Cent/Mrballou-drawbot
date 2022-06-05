import sys
import tkinter as tk
import json
import multiprocessing
import sys
import requests
import os
from pynput import keyboard

projectData = {}
positionData = {}
settingsData = {}


def getData(file):
    print('reading data from ' + file)
    if os.path.exists(file):
        with open(file, "r") as f:
            return json.load(f)
    return {}


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

    root = tk.Tk()
    root.title(projectData['name'])
    # root.geometry('200x200')

    # setting platform to draw

    tk.Label(root, text='Platform').grid(row=0, column=0)
    platform = tk.StringVar(root)
    platforms = getPlatforms(positionData)
    platformOpts = tk.OptionMenu(root, platform, *platforms)
    platformOpts.grid(row=0, column=1)

    # speed
    speedVal = tk.IntVar(root)
    tk.Label(root, text='Delay').grid(row=1, column=0)
    speed = tk.Entry(root, textvariable=speedVal)
    speed.grid(row=1, column=1)

    # distancing
    distanceVal = tk.IntVar(root)
    tk.Label(root, text='Distance').grid(row=2, column=0)
    distance = tk.Entry(root, textvariable=distanceVal)
    distance.grid(row=2, column=1)

    # checkboxes

    # sort colors
    sortVal = tk.BooleanVar()
    sort = tk.Checkbutton(root, text='Sort colors', variable=sortVal)
    sort.grid(row=3, column=0)

    # dither
    ditherVal = tk.BooleanVar()
    dither = tk.Checkbutton(root, text='Dither', variable=ditherVal)
    dither.grid(row=3, column=1)

    # fast mode
    fastVal = tk.BooleanVar()
    fast = tk.Checkbutton(root, text='Fast mode', variable=fastVal)
    fast.grid(row=4, column=0)

    # bucket
    bucketVal = tk.BooleanVar()
    bucket = tk.Checkbutton(root, text='Bucket', variable=bucketVal)
    bucket.grid(row=4, column=1)

    # todo: dither algorithm

    # ignore color
    # todo: add check for valid color
    # todo: add to settings
    tk.Label(root, text='Ignore color').grid(row=5, column=0)
    ignore = tk.Entry(root)
    ignore.grid(row=5, column=1)

    # max lines
    maxLinesVal = tk.IntVar(root)
    tk.Label(root, text='Max lines').grid(row=6, column=0)
    maxLines = tk.Entry(root, textvariable=maxLinesVal)
    maxLines.grid(row=6, column=1)

    # delay between colors
    colorDelayVal = tk.IntVar(root)
    tk.Label(root, text='Delay between colors').grid(row=7, column=0)
    colorDelay = tk.Entry(root, textvariable=colorDelayVal)
    colorDelay.grid(row=7, column=1)

    # image
    imageVal = tk.StringVar(root)
    tk.Label(root, text='Image URL').grid(row=8, column=0)
    image = tk.Entry(root, textvariable=imageVal)
    image.grid(row=8, column=1)

    # draw button
    tk.Button(root, text='Draw', command=startDraw).grid(row=9, column=1)

    # save / load configurations
    # save
    # tk.Label(root, text='Save configuration').grid(row=10, column=0)
    saveVal = tk.StringVar(root)
    tk.Button(root, text='Save config',
              command=saveConfig).grid(row=10, column=0)
    save = tk.Entry(root, textvariable=saveVal)
    save.grid(row=10, column=1)

    # load
    tk.Button(root, text='Load config',
              command=lambda: loadData(getSaveData(loadVal.get()))).grid(row=11, column=0)

    loadVal = tk.StringVar(root)
    load = tk.OptionMenu(root, loadVal, *getSaves())
    load.grid(row=11, column=1)

    # version
    version = tk.Label(root, text="Version: " + projectData["version"])
    version.grid()

    loadData(settingsData)
    root.mainloop()


def onPress(key):
    if key == keyboard.Key.esc or key == config['abortKey']:
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

    guiThread = multiprocessing.Process(target=main, args=(config['port'],))
    guiThread.start()

    keyboardThread = multiprocessing.Process(target=keyboardListener)
    keyboardThread.start()

    while True:
        if not guiThread.is_alive():
            print("GUI thread died... exiting")
            keyboardThread.kill()
            sys.exit()

        if not keyboardThread.is_alive():
            print("keyboard thread died... exiting")
            guiThread.kill()
            sys.exit()
