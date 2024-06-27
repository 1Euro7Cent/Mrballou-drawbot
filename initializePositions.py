import json
from pynput import mouse
import pyautogui
import sys


def boolInput(question):
    while True:
        try:
            return {"y": True, "n": False}[input(question + "(y/n) ").lower()]
        except KeyError:
            print("Invalid input please enter true or false")

# this function writes the json with the position content
filename = "positions.json"
name = input("Please enter the name of the position preset: ")

# validBucket = False
# while not validBucket:
#     bucket = input("Has the position set a bucket? (y/n) ")
#     validBucket = bucket == "y" or bucket == "n"

bucket = boolInput("Has the position set a bucket?")
twoColors = boolInput("Can there be drawn with two colors? (left and right click)")
clickToExpand = boolInput("Do you need to click to select (more) colors?")

clickToClose = False
if clickToExpand:
    clickToClose = boolInput("Do you need to click to close the color picker?")


positions = {
    name: {
        "topleft": {
            "x": -1,
            "y": -1
        },
        "bottomright": {
            "x": -1,
            "y": -1
        },
        "primaryColor": {
            "x": -1,
            "y": -1
        },
        "secondaryColor": {
            "x": -1,
            "y": -1
        },
        "bucket": {
            "x": -1,
            "y": -1
        },
        "pen": {
            "x": -1,
            "y": -1
        },
        "clickToExpand": {
            "x": -1,
            "y": -1
        },
        "clickToClose": {
            "x": -1,
            "y": -1
        },
        "colors": {

        }
    }
}

status = "topleft"
listener = ''

if twoColors:
    status = "primaryColor"
else:

    if bucket:
        status = "bucket"





def rgbToHex(r, g, b):
    return '#{:02x}{:02x}{:02x}'.format(r, g, b)


def onClick(x, y, button, pressed):
    global status

    if pressed:
        if button == mouse.Button.right:
            # save the json file while appending it
            oldData = {}
            with open(filename, 'r') as f:
                oldData = json.load(f)

            with open(filename, 'w') as f:
                oldData[name] = positions[name]
                json.dump(oldData, f)

            print("Saved to file")
            listener.stop()
            sys.exit()
            return

        # print("Click: " + str(x) + " " + str(y) +" " + str(button) + " " + str(pressed))
        if status == "primaryColor":
            positions[name]["primaryColor"]["x"] = x
            positions[name]["primaryColor"]["y"] = y
            status = "secondaryColor"
            return

        if status == "secondaryColor":
            positions[name]["secondaryColor"]["x"] = x
            positions[name]["secondaryColor"]["y"] = y
            if bucket:
                status = "bucket"
            else:
                status = "topleft"
            return

        if status == "bucket":
            positions[name]["bucket"]["x"] = x
            positions[name]["bucket"]["y"] = y
            status = "pen"
            return

        if status == "pen":
            positions[name]["pen"]["x"] = x
            positions[name]["pen"]["y"] = y

            if clickToExpand:
                status = "clickToExpand"
            else:
                status = "topleft"
                
            # status = "topleft"
            return
        
        if status == "clickToExpand":
            positions[name]["clickToExpand"]["x"] = x
            positions[name]["clickToExpand"]["y"] = y
            if clickToClose:
                # print('click to close the color picker')
                status = "clickToClose"
            else:
                status = "topleft"
            return
        
        if status == "clickToClose":
            positions[name]["clickToClose"]["x"] = x
            positions[name]["clickToClose"]["y"] = y
            # print('click to close the color picker')
            status = "topleft"
            return

        if status == "topleft":
            positions[name]["topleft"]["x"] = x
            positions[name]["topleft"]["y"] = y
            status = "bottomright"
            return

        if status == "bottomright":
            positions[name]["bottomright"]["x"] = x
            positions[name]["bottomright"]["y"] = y
            if clickToExpand:
                # print('click to expand the color picker to be able to click on all colors')
                status = "skipClick"
            else:
                status = "colors"

            return

        if status == "skipClick":
            # print('click to expand the color picker to be able to click on all colors')
            status = "colors"
            return

        if status == "colors":
            color = pyautogui.pixel(x, y)
            hex = rgbToHex(color[0], color[1], color[2])

            print(f'{x} {y} {hex}'.format(x, y, hex))
            positions[name]["colors"][hex] = {
                "x": x,
                "y": y
            }

            if not clickToClose and clickToExpand:
                status = "skipClick"
            return

    else: # button released
        match status:   
            case "primaryColor":
                print('put the mouse at the primary color and click')
            case "secondaryColor":
                print('put the mouse at the secondary color and click')
            case "bucket":
                print('click on the bucket')
            case "pen":
                print('put the mouse at the tool that you want to use to draw and click')
            case "topleft":
                print('put the mouse at the top left of the drawing canvas and click')
            case "bottomright":
                print('now at the bottom right')
            case "colors":
                print('and now over every printable color')
            case "clickToExpand":
                print('click to expand the color picker')
            case "clickToClose":
                print('click to close the color picker')
            case "skipClick":
                print('the next click is not counted. open the color picker and click on the next color')

def main():
    with mouse.Listener(on_click=onClick) as l:
        global listener
        listener = l

        onClick(-1, -1, mouse.Button.left, False) # trigger the first message


        l.join()


if __name__ == "__main__":
    main()
