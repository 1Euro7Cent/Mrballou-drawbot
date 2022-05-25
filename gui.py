import sys
import tkinter as tk
import json
import multiprocessing
import sys
import requests
from pynput import keyboard

projectData = {}
positionData = {}
settingsData = {}


def getData(file):
    print('reading data from ' + file)
    with open(file, "r") as f:
        return json.load(f)


def getPlatforms(data):
    res = []
    for platform in data:
        res.append(platform)
    return res


def main(port):
    def saveConfig():
        print('saving configuration')

    def startDraw():
        print('starting draw')
        res = {
            "name": platform.get(),
            "img": image.get(),
            "delay": float(speed.get() or 1),
            "distancing": float(distance.get() or 1),
            "sortColors": sortVal.get(),
            "dither": ditherVal.get(),
            "fast": fastVal.get(),
            "bucket": bucketVal.get(),
            "maxLines": int(maxLines.get() or 999999),
            "colorDelay": float(delay.get() or 0),
        }
        with open('settings.json', 'w') as f:
            json.dump(res, f)

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
    tk.Label(root, text='Delay').grid(row=1, column=0)
    speed = tk.Entry(root)
    speed.grid(row=1, column=1)

    # distancing
    tk.Label(root, text='Distance').grid(row=2, column=0)
    distance = tk.Entry(root)
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
    tk.Label(root, text='Max lines').grid(row=6, column=0)
    maxLines = tk.Entry(root)
    maxLines.grid(row=6, column=1)

    # delay between colors
    tk.Label(root, text='Delay between colors').grid(row=7, column=0)
    delay = tk.Entry(root)
    delay.grid(row=7, column=1)

    # image
    tk.Label(root, text='Image URL').grid(row=8, column=0)
    image = tk.Entry(root)
    image.grid(row=8, column=1)

    # draw button
    tk.Button(root, text='Draw', command=startDraw).grid(row=9, column=1)

    # save / load configurations
    # save
    # tk.Label(root, text='Save configuration').grid(row=10, column=0)
    tk.Button(root, text='Save config',
              command=saveConfig).grid(row=10, column=0)
    save = tk.Entry(root)
    save.grid(row=10, column=1)

    # load
    # todo: read from file and display in option menu

    # version
    version = tk.Label(root, text="Version: " + projectData["version"])
    version.grid()
    root.mainloop()


def onPress(key):
    if key == keyboard.Key.esc:
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
