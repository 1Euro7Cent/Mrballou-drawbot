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
from CTkColorPicker import *

dataQueue = queue.Queue()
valueQueue = queue.Queue()

projectData = {}
positionData = {}
settingsData = {}
guiData = {}



serverAddress = "http://localhost"

wsConn = None

reconnectRetries = 0

def communication(cfg):
    global reconnectRetries
    global wsConn

    senderPing = cfg['communication']['keepAlive']['messageSender']
    receiverPing = cfg['communication']['keepAlive']['messageReceiver']

    def onWsMessage(ws, message):
        global reconnectRetries
        # keep alive
        if message == senderPing:
            ws.send(receiverPing)
            reconnectRetries = 0
            # print("Got keep alive message")
            return

        # print("Got message {}".format(message))
        data = json.loads(message)
        # print(data)
        dataQueue.put(data)
        # print("data queue {}".format(dataQueue.queue))

    def onWsError(ws, error):
        global reconnectRetries
        print("Got error {}".format(error))
        # handle no connection error
        if "10061" in str(error):
            reconnectRetries += 1
            print("No connection to server")
            print("trying to reconnect...")
            dataQueue.put({
                "type": "updateUI", 
                "data": [[
                        {"type": "label", "text": "No connection to server. Reconnecting... Try {}".format(reconnectRetries)}
                    ],[
                        {"type": "label", "text": "Is the server running?"}
                    ]
                    ]
                })
            wsConn.close()
            wsConn.run_forever()    
        else:
            sys.exit()
    
    def onWsClose(ws):
        print("Got close")
        sys.exit()


    wsConn = ws.WebSocketApp("ws://localhost:{}".format(cfg['port']),
                             on_message=onWsMessage,
                                on_error=onWsError,
                                on_close=onWsClose)
    
    print("establishing connection with server on port {}".format(cfg['port']))

    dataQueue.put({
        "type": "updateUI", 
        "data": [[
                {"type": "label", "text": "Connecting to server..."}
            ]
            ]
        })
    wsConn.run_forever()


def onButton(buttonName):
    print("Button pressed {}".format(buttonName))
    data = {}
    if not valueQueue.empty():
        data = valueQueue.queue[0]
    # print("Button pressed")
    # print("dataToSync {}".format(data))
    formattedData = {}
    for val in data:
        formattedData[val] = data[val].get()


    # wsConn.send(json.dumps({"type": "buttonPressed", "data": formattedData}))
    # print("data to send")
    # print(formattedData)
    wsConn.send(json.dumps({"type": "buttonPressed", "button": buttonName, "data": formattedData}))
    
    # valueQueue.put(data)

def updateGui(window):
    # print("Updating gui check")

    #empty the queue
    # while not valueQueue.empty():
    #     valueQueue.get()

    dataToSync = {}
    # print("data queue {}".format(dataQueue.queue))

    if not dataQueue.empty():
        data = dataQueue.get()
        # print("Got data from gui thread {}".format(data))
        if data["type"] == "requestColor":
            col = AskColor().get()
            wsConn.send(json.dumps({"type": "color", "data": col}))
            window.after(100, updateGui, window)
            return

        if data["type"] == "updateUI":
            valueQueue.queue = []
            # print("Updating UI")
            guiData = data["data"]
            # print(guiData)
            
            for widget in window.winfo_children():
                widget.destroy()

            rows = 0
            wantsFontChanged = False
            fontChangeTo =""
            for row in guiData:
                columns = 0 
                # print("row {} {}".format(columns, rows))
                # print("row {}".format(row))
                rows += 1
                # if element["type"] == "TextElement":
                #     print("Adding text element")
                #     ctk.CTkLabel(window, text=element["text"]).pack()


                for element in row:
                    # print("element {}".format(element))
                    columns += 1

                    match element["type"]:
                        case 'font':
                            wantsFontChanged = True
                            fontChangeTo = element["font"]
                        case "geometry":
                            # # print("Setting geometry")
                            # width = element["width"]
                            # height = element["height"]

                            # x = None
                            # y = None

                            # if "x" in element:
                            #     x = element["x"]
                            
                            # if "y" in element:
                            #     y = element["y"]

                            # geomStr =""

                            # if x and y:
                            #     geomStr = "{}x{}+{}+{}".format(width,height,x, y)
                            # else:
                            #     geomStr = "{}x{}".format(width,height) 
                            
                            # # print("geomString {}".format(geomStr))
                            # window.geometry(geomStr)

                            width = None
                            height = None
                            x = None
                            y = None

                            if "width" in element:
                                width = element["width"]

                            if "height" in element:
                                height = element["height"]

                            if "x" in element:
                                x = element["x"]
                            
                            if "y" in element:
                                y = element["y"]

                            geomStr =""

                            if width and height and x and y:
                                geomStr = "{}x{}+{}+{}".format(width,height,x, y)
                            elif width and height:
                                geomStr = "{}x{}".format(width,height)
                            elif x and y:
                                geomStr = "{}+{}".format(x, y)

                            # print("geomString {}".format(geomStr))

                            if geomStr != "":
                                window.geometry(geomStr)

                        case "title":
                            # print("Adding title element")
                            window.title(element["text"])
                        case "label":
                            # print("Adding text element")
                            if "color" in element:
                                fgColor = element["color"]
                                textColor = getTextColor(fgColor)
                                print("fgColor {} textColor {}".format(fgColor, textColor))
                                ctk.CTkLabel(window, text=element["text"],fg_color=fgColor, text_color=textColor, padx= 3 ).grid(row=rows, column=columns)
                            else:
                                ctk.CTkLabel(window, text=element["text"]).grid(row=rows, column=columns)
                        case "checkbox": 
                            # print("Adding checkbox element")
                            checkBoxVal = ctk.BooleanVar(value=element["checked"])
                            dataToSync[element["name"]] = checkBoxVal
                            ctk.CTkCheckBox(window, text=element["text"], variable=checkBoxVal).grid(row=rows, column=columns)
                            # dataToSync.append(checkBoxVal)

                        case "button":
                            # print("Adding button element")
                            btn = element["name"]
                            ctk.CTkButton(window, text=element["text"], command=lambda button=btn: onButton(button)).grid(row=rows, column=columns)
                            # ctk.CTkButton(window, text=element["text"], command=onButton).grid(row=rows, column=columns)
                        case "entry":
                            # print("Adding entry element")
                            entryVal = ctk.StringVar(window)
                            entryVal.set(element["content"])
                            dataToSync[element["name"]] = entryVal
                            ctk.CTkEntry(window, textvariable=entryVal).grid(row=rows, column=columns)

                        case "dropdown":
                            # print("Adding dropdown element")
                            dropdownVal = ctk.StringVar(window)
                            if "selected" in element:
                                dropdownVal.set(element["selected"])
                            dataToSync[element["name"]] = dropdownVal
                            # print("values {}".format(element["values"]))
                            ctk.CTkOptionMenu(window, variable=dropdownVal, values=element["values"]).grid(row=rows, column=columns)

        if wantsFontChanged:
            fontName, fontSize = fontChangeTo.split(" ")
            fontSize = int(fontSize)
            for widget in window.winfo_children():
                widget.configure(font=(fontName, fontSize))

    valueQueue.put(dataToSync)
    # print("dataToSync {}".format(dataToSync))

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
        wsConn.send("stop")
        # with open(path, 'w') as f:
        #     json.dump({"abort": True}, f)


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


# a function that decides weather the most readable color for a given background color is black or white
def getTextColor(hex):
    hex = hex.replace("#", "")
    r = int(hex[0:2], 16)
    g = int(hex[2:4], 16)
    b = int(hex[4:6], 16)

    # print("r {} g {} b {}".format(r, g, b))
    # print("r+g+b {}".format(r+g+b))
    if r+g+b > 382:
        return "#000000"
    else:
        return "#ffffff"


def negativeColor(hex):
    hex = hex.replace("#", "")
    r = int(hex[0:2], 16)
    g = int(hex[2:4], 16)
    b = int(hex[4:6], 16)

    r = 255 - r
    g = 255 - g
    b = 255 - b

    return "#%02x%02x%02x" % (r, g, b)

# print(negativeColor("#000000"))
# print(negativeColor("#ffffff"))
# print(negativeColor("#ff0000"))

if __name__ == "__main__":
    print("Starting")

    # print(config) 
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
