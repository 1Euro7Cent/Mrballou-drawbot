from pynput import keyboard, mouse
# import tkinter as tk
import customtkinter as ctk
import json
import threading
import sys
import queue
import requests
import os
import time
import websocket as ws

dataQueue = queue.Queue()
valueQueue = queue.Queue()

projectData = {}
positionData = {}
settingsData = {}
guiData = {}

dataToSync = []


serverAddress = "http://localhost"

wsConn = None


def communication(cfg):
    global wsConn

    senderPing = cfg['communication']['keepAlive']['messageSender']
    receiverPing = cfg['communication']['keepAlive']['messageReceiver']

    def onWsMessage(ws, message):

        # keep alive
        if message == senderPing:
            ws.send(receiverPing)
            return

        print("Got message {}".format(message))
        data = json.loads(message)
        # print(data)
        dataQueue.put(data)

    def onWsError(ws, error):
        print("Got error {}".format(error))
        sys.exit()
    
    def onWsClose(ws):
        print("Got close")
        sys.exit()


    wsConn = ws.WebSocketApp("ws://localhost:{}".format(cfg['port']),
                             on_message=onWsMessage,
                                on_error=onWsError,
                                on_close=onWsClose)
    
    print("establishing connection with server on port {}".format(cfg['port']))
    wsConn.run_forever()


def updateGui(window):
    # print("Updating gui check")
    global dataToSync
    dataToSync = []

    if not dataQueue.empty():
        data = dataQueue.get()
        print("Got data from gui thread {}".format(data))
        if data["type"] == "updateUI":
            print("Updating UI")
            guiData = data["data"]
            print(guiData)
            
            for widget in window.winfo_children():
                widget.destroy()
            
            for element in guiData:
                print(element)
                # if element["type"] == "TextElement":
                #     print("Adding text element")
                #     ctk.CTkLabel(window, text=element["text"]).pack()

                match element["type"]:
                    case "geometry":
                        print("Setting geometry")
                        width = element["width"]
                        height = element["height"]

                        x = None
                        y = None

                        if "x" in element:
                            x = element["x"]
                        
                        if "y" in element:
                            y = element["y"]

                        geomStr =""

                        if x and y:
                            geomStr = "{}x{}+{}+{}".format(width,height,x, y)
                        else:
                            geomStr = "{}x{}".format(width,height) 
                        
                        print("geomString {}".format(geomStr))
                        window.geometry(geomStr)
                    case "title":
                        print("Adding title element")
                        window.title(element["text"])
                    case "label":
                        print("Adding text element")
                        ctk.CTkLabel(window, text=element["text"]).pack()
                    case "checkbox": 
                        print("Adding checkbox element")
                        checkBoxVal = ctk.BooleanVar(value=element["checked"], name=element["name"])
                        ctk.CTkCheckBox(window, text=element["text"], variable=checkBoxVal).pack()
                        dataToSync.append(checkBoxVal)



    window.after(100, updateGui, window)


def main():
    window = ctk.CTk()
    window.title("GUI")

    window.after(100, updateGui, window)
    window.mainloop()



def onPress(key):
    if key == keyboard.Key.esc or key == keyboard.KeyCode.from_char(config['abortKey']):
        print("Aborting")
        # create a new json file
        with open(path, 'w') as f:
            json.dump({"abort": True}, f)


def onClick(x, y, button, pressed):
    ""
    # global manualOverrideVal
    # global requestingManualOverride
    # if requestingManualOverride and pressed and button == mouse.Button.left:
    #     print("Manual overrise pressed at {} {}".format(x, y))

    #    # if x1 and y1 are not set, set them to the current position
    #    # the same for x2 and y2 but with the next click
    #     if manualOverrideVal["x1"] < 0 or manualOverrideVal["y1"] < 0:
    #         manualOverrideVal["x1"] = x
    #         manualOverrideVal["y1"] = y
    #     else:

    #         if manualOverrideVal["x2"] < 0 or manualOverrideVal["y2"] < 0:
    #             manualOverrideVal["x2"] = x
    #             manualOverrideVal["y2"] = y
    #             requestingManualOverride = False

    #             print(manualOverrideVal)


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

    print(config) 
    communicationThread = threading.Thread(target=communication, args=(config,))
    communicationThread.daemon = True
    communicationThread.start()

    guiThread = threading.Thread(target=main)
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
        
        if not communicationThread.is_alive():
            print("websocket thread died... exiting")
            sys.exit()

        if not keyboardThread.is_alive():
            print("keyboard thread died... exiting")
            sys.exit()

        if not mouseThread.is_alive():
            print("mouse thread died... exiting")
            sys.exit()

        time.sleep(1)
