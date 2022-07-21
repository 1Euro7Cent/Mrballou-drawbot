import json
from pynput import mouse
import pyautogui
import sys


# this function writes the json with the position content
filename = "positions.json"
name = input("Please enter the name of the position preset: ")

validBucket = False
while not validBucket:
    bucket = input("Has the position set a bucket? (y/n) ")
    validBucket = bucket == "y" or bucket == "n"


positions = {
    name: {
        "topleft": {
            "x": 0,
            "y": 0
        },
        "bottomright": {
            "x": 0,
            "y": 0
        },
        "bucket": {
            "x": -1,
            "y": -1
        },
        "pen": {
            "x": -1,
            "y": -1
        },
        "colors": {

        }
    }
}

status = "topleft"
listener = ''

if bucket == "y":
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
        if status == "bucket":
            positions[name]["bucket"]["x"] = x
            positions[name]["bucket"]["y"] = y
            status = "pen"
            print('put the mouse at the tool that you want to use to draw and click')
            return

        if status == "pen":
            positions[name]["pen"]["x"] = x
            positions[name]["pen"]["y"] = y
            status = "topleft"
            print('put the mouse at the top left of the drawing canvas and click')
            return

        if status == "topleft":
            positions[name]["topleft"]["x"] = x
            positions[name]["topleft"]["y"] = y
            status = "bottomright"
            print('now at the bottom right')
            return

        if status == "bottomright":
            positions[name]["bottomright"]["x"] = x
            positions[name]["bottomright"]["y"] = y
            status = "colors"
            print('and now over every printable color')
            return

        if status == "colors":
            color = pyautogui.pixel(x, y)
            hex = rgbToHex(color[0], color[1], color[2])

            print(f'{x} {y} {hex}'.format(x, y, hex))
            positions[name]["colors"][hex] = {
                "x": x,
                "y": y
            }
            return


def main():
    with mouse.Listener(on_click=onClick) as l:
        global listener
        listener = l

        print('you can abort that process by pressing right lick')
        if bucket == "y":
            print('click on the bucket')
        else:
            print('put the mouse at the top left of the drawing canvas and click')
        l.join()


if __name__ == "__main__":
    main()
