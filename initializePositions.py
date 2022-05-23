import json
from pynput import mouse
import pyautogui
import sys


# this function writes the json with the position content
filename = "positions.json"
name = input("Please enter the name of the position preset: ")


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
        "colors": {

        }
    }
}

status = "topleft"
listener = ''


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
        if status == "topleft":
            positions[name]["topleft"]["x"] = x
            positions[name]["topleft"]["y"] = y
            status = "bottomright"
            print('now at the bottom left')
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
        print('put the mouse at the top left of the drawing canvas and click')
        l.join()


if __name__ == "__main__":
    main()
