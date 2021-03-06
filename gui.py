import tkinter as tk
import requests
import json
import threading
import pynput
from pynput.keyboard import Key, Listener
#from icrawler.builtin import GoogleImageCrawler
import os
#from PIL import ImageTk, Image
defaultValues = {"platform": "skribbl",
                 "image": "https://cdn.discordapp.com/attachments/818941739535564811/825802466498576402/unknown.png",
                 "speed": 1.0,
                 "oneLineIs": 2.0,
                 "accuracy": 1.0,
                 "dither": 0,
                 "ditherAccuracy": 2.0,
                 "totallines": 999999.0,
                 "sortColors": 1,
                 "delayBetweenColors": 0.0,
                 "fast": 1,
                 "bucket": 1}


URL = 'http://localhost:49152/draw'


def windowopener():

    def draw():
        if e1.get() == '' or e1.get() == '' or e2.get() == '' or e3.get() == '' or e4.get() == '' or e5.get() == '' or e6.get() == '' or num.get == '':

            w = tk.Label(
                window, text="ERROR! at least one value is empty", fg='red')
            w.grid(column=1)

        else:

            # if googleImageing.get() == 1:
            #    f = open('./server/config.json')
            #    data = json.load(f)
            #    #data = json.loads(data)
            #    platform = e2.get()
            #    print(platform)
            #    #print (data["paint"]["positions"])
            #
            #    maxSize = {
            #        "w": (data[platform]["positions"]["bottomright"]["x"] - data[platform]["positions"]["topleft"]["x"]) / float(e4.get()),
            #        "h": (data[platform]["positions"]["bottomright"]["y"] - data[platform]["positions"]["topleft"]["y"]) / float(e4.get())
            #    }
            #
            #    print(maxSize)
            #    google_crawler = GoogleImageCrawler(
            #        storage={'root_dir': './server/google images'})
            #    google_crawler.crawl(
            #        keyword=e1.get(), max_num=5, max_size=(maxSize["w"], maxSize["h"]))
            #
            #    image = './server/google images/000001.png'
            # else:
            image = e1.get()

            f = open("./server/gui.json", "w")
            json.dump({
                "platform": e2.get(),
                "image": image,
                "speed": float(e3.get()),
                "oneLineIs": float(e4.get()),
                "accuracy": float(e5.get()),
                "dither": dithering.get(),
                "ditherAccuracy": float(e6.get()),
                "totallines": float(num.get()),
                "sortColors": box.get(),
                "delayBetweenColors":  float(delay.get()),
                "fast": resizing.get(),
                "bucket": bucket.get()
            }, f)
            f.close()
            requests.get(url=URL, params={})

    window = tk.Tk()

    window.title('Drawbot by mrballou')

    tk.Label(window, text="platform").grid(row=0)
    tk.Label(window, text="speed").grid(row=1)
    tk.Label(window, text="one line is").grid(row=2)
    tk.Label(window, text="accuracy").grid(row=3)
    tk.Label(window, text="ditherAccuracy").grid(row=4)
    tk.Label(window, text="total lines").grid(row=7)
    tk.Label(window, text="Delay between colors").grid(row=8)
    tk.Label(window, text="Image URL").grid(row=9)

    e1 = tk.Entry(window)
    e2 = tk.Entry(window)
    e3 = tk.Entry(window)
    e4 = tk.Entry(window)
    e5 = tk.Entry(window)
    e6 = tk.Entry(window)
    num = tk.Entry(window)
    delay = tk.Entry(window)

    s = open("./server/gui.json", "r")
    data = json.load(s)

    # print(data['image'])

    e1.insert(
        0, data['image'])
    e2.insert(0, data['platform'])
    e3.insert(0, data['speed'])
    e4.insert(0, data['oneLineIs'])
    e5.insert(0, data['accuracy'])
    e6.insert(0, data['ditherAccuracy'])
    num.insert(0, data['totallines'])
    delay.insert(0, data['delayBetweenColors'])

    e1.grid(row=9, column=1)
    e2.grid(row=0, column=1)
    e3.grid(row=1, column=1)
    e4.grid(row=2, column=1)
    e5.grid(row=3, column=1)
    e6.grid(row=4, column=1)
    num.grid(row=7, column=1)
    delay.grid(row=8, column=1)

    dithering = tk.IntVar()
    tk.Checkbutton(window, text="Dither",
                   variable=dithering).grid(row=5, column=1)
    box = tk.IntVar()

    tk.Checkbutton(window, text="Sort colors",
                   variable=box).grid(row=5, column=0)

    #googleImageing = tk.IntVar()
    # tk.Checkbutton(window, text="Google imageing",
    #               variable=googleImageing).grid(row=10, column=1)
    resizing = tk.IntVar()
    tk.Checkbutton(window, text="Fast mode",
                   variable=resizing).grid(row=6, column=0)
    bucket = tk.IntVar()
    tk.Checkbutton(window, text="Bucket",
                   variable=bucket).grid(row=6, column=1)

    button = tk.Button(window, text='Draw', width=5, command=draw)
    button.grid(column=1)

    button = tk.Button(window, text='Quit', fg="red", width=8, command=quit)
    button.grid(column=0)

    if data['dither'] == 1:
        dithering.set(True)
    else:
        dithering.set(False)

    if data['sortColors'] == 1:
        box.set(True)
    else:
        box.set(False)
    if data['fast'] == 1:
        resizing.set(True)
    else:
        resizing.set(False)
    if data['bucket'] == 1:
        bucket.set(True)
    else:
        bucket.set(False)

    window.mainloop()


x = threading.Thread(target=windowopener, args=())
x.start()


def on_release(key):
    if key == Key.esc:
        print('ESC pressed. Aborting print')
        f = open("./server/aborting.json", "w")
        f.close()
        # quit()


with Listener(on_release=on_release) as Listener:
    Listener.join()
