import json
from pynput import keyboard

config = {}

with open('config.json', 'r') as f:
    config = json.load(f)

path = config["temp"]+config["abortingFile"]


def onPress(key):
    if key == keyboard.Key.esc:
        print("Aborting")
        # create a new json file
        with open(path, 'w') as f:
            json.dump({"abort": True}, f)


with keyboard.Listener(on_press=onPress) as listener:
    listener.join()
