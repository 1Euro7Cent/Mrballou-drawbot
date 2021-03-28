import tkinter as tk
import requests
import json

import threading

import pynput
from pynput.keyboard import Key, Listener



URL = 'http://localhost:1337/draw'

def windowopener():

    def draw():
        if e1.get() == '' or e1.get() == '' or e2.get() == '' or e3.get() == '' or e4.get() == '' or e5.get() == '' or e6.get() == '' or num.get == '':
            if not e3.get().isnumeric() or not e4.get().isnumeric() or not e5.get().isnumeric() or not e6.get().isnumeric():

                w = tk.Label(
                    window, text="ERROR! at least one value is empty", fg='red')
                w.grid(column=1)
            else:
                w = tk.Label(
                    window, text="ERROR! at least one value that should be a number is not a number", fg='red')
                w.grid(column=1)

        else:
            f = open("./server/gui.json", "w")
            json.dump({
                "platform": e2.get(),
                "image": e1.get(),
                "speed": float(e3.get()),
                "oneLineIs": float(e4.get()),
                "accuracy": float(e5.get()),
                "dither": dithering.get(),
                "ditherAccuracy": float(e6.get()),
                "totallines": float(num.get()),
                "box": box.get(),
                "delayBetweenColors":  float(delay.get())
            }, f)
            f.close()
            requests.get(url=URL, params={})


    window = tk.Tk()


    window.title('Drawbot by mrballou')


    tk.Label(window, text="Image URL").grid(row=0)
    tk.Label(window, text="platform").grid(row=1)
    tk.Label(window, text="speed").grid(row=2)
    tk.Label(window, text="one line is").grid(row=3)
    tk.Label(window, text="accuracy").grid(row=4)
    tk.Label(window, text="ditherAccuracy").grid(row=6)
    tk.Label(window, text="total lines").grid(row=7)
    tk.Label(window, text="Delay between colors").grid(row=9)

    e1 = tk.Entry(window)
    e2 = tk.Entry(window)
    e3 = tk.Entry(window)
    e4 = tk.Entry(window)
    e5 = tk.Entry(window)
    e6 = tk.Entry(window)
    num = tk.Entry(window)
    delay = tk.Entry(window)

    e1.insert(0,'https://cdn.discordapp.com/attachments/818941739535564811/825802466498576402/unknown.png')
    e2.insert(0,'skribbl')
    e3.insert(0, '1')
    e4.insert(0, '2')
    e5.insert(0, '1')
    e6.insert(0, '2')
    num.insert(0, '999999')    
    delay.insert(0,'0')

    e1.grid(row=0, column=1)
    e2.grid(row=1, column=1)
    e3.grid(row=2, column=1)
    e4.grid(row=3, column=1)
    e5.grid(row=4, column=1)
    e6.grid(row=6, column=1)
    num.grid(row=7, column=1)
    delay.grid(row=9, column=1)
    


    dithering = tk.IntVar()
    tk.Checkbutton(window, text="Dither", variable=dithering).grid(row=5, column=1)
    box = tk.IntVar()
    tk.Checkbutton(window, text="Box", variable=box).grid(row=5, column=0)

    button = tk.Button(window, text='Draw', width=5, command=draw)
    button.grid(column=1)

    button = tk.Button(window, text='Quit', fg="red", width=8, command=quit)
    button.grid(column=0)


    window.mainloop()

x = threading.Thread(target=windowopener, args=())
x.start()

def on_press (key):
    print("{0} presed".format(key))

def on_release(key):
    if key == Key.esc:
        f = open("./server/aborting.json", "w")
        f.close()
        #quit()

with Listener(on_press = on_press, on_release= on_release) as Listener:
    Listener.join()