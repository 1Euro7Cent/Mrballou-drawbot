<div style="text-align: center; ">

<img alt="GitHub all releases" src="https://img.shields.io/github/downloads/1euro7cent/Mrballou-drawbot/total">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/1Euro7Cent/Mrballou-drawbot">
<img alt="GitHub forks" src="https://img.shields.io/github/forks/1Euro7Cent/Mrballou-drawbot">
<img alt="GitHub watchers" src="https://img.shields.io/github/watchers/1Euro7Cent/Mrballou-drawbot">
<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/1Euro7Cent/Mrballou-drawbot">
<img alt="Lines of code" src="https://tokei.rs/b1/github/1Euro7Cent/Mrballou-drawbot?category=code">

</div>

## This is a beta!

If you have questions suggestions or bugs, first read the FAQ. If not found please open an issue or send me a dm per Discord (mrballou)

## installation video (click image):

[![placeholder](https://img.youtube.com/vi/3Js--QGcVpI/0.jpg)](https://youtu.be/3Js--QGcVpI)

## Important!

* I forgot to mention in the video that you can abort the print by pressing the `esc` key or `q`(definable in the config.json).

* Read the TOS from the website you want to draw on. If the website disallows such things don't draw with the bot on it.

## Installation

* Go to releases.
* Download the latest release.
* Extract the zip file into a folder.
* Run `initializePositions.exe` and follow the instructions (abort/save with right click).
* Run the `drawbot.exe`.
* Run `gui.exe`.
* Enjoy!

## Build

* Clone repo.
* Have [c++ build tools](https://visualstudio.microsoft.com/en/) installed.
* Have [python 3.10+](https://www.python.org/downloads/) installed.
* Have [nodejs 16+](https://nodejs.org/en/) installed.
* Install pip requirements (`pip install -r requirements.txt`).
* Install npm dependencies (`npm install`).
* To build run `npm run build`.
* To run the main bot run `node index.js`.
* To run the GUI run `python gui.py`.

## Development 

* Planned features:

  + If you want to see the development progress or planned features, you can do so by visiting the [projects](https://github.com/users/1Euro7Cent/projects/1/views/1) page
  
* Contributing:
  
    - If you want to contribute to the project, you can do so by opening a pull request. I will review it and merge it if it fits the project.
    - If you want a feature to be implemented, you can open an issue and I will look into it.
    

## Support me

I invest my free time into this project. If you want to support me, you can do so by donating to me via paypal. These donations will keep the project alive, free and help me to continue working on it.
| <center>Paypal |
| --- |
| [![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://paypal.me/thomasjRuhl)

## FAQ:

* Does the bot work on katura?
  + Yes, but also no. It works, but the website is really slow, and you need to crank up the delay.
  
    I recommend settings like:
    - delay: `15`
    - sort colors by: `size 9-0` (so it draws the bulk first)
    - onTimeDelay: `yes`
    - onTimeDelayMultiplyer: `0.6` (this makes it really slow but work)
    - fast: `yes`
    - line save: `yes`
    
    feel free to suggest other settings

* It draws outside the boundary and/or not in the right spot
  + Make sure that `Make everything bigger` and `scale and layout` in windows is set to 100%. (Settings -> System -> Display -> Scale and layout)

* I have the error `Error: Could not find MIME for Buffer`
  + Make sure that you have a valid image selected. valid image rules are:
    - `your/path/to/image.png`(`.jpg`, `.jpeg`, `.gif`, `.bmp`, [See all supported formats](https://www.npmjs.com/package/jimp))
    - `http(s)://example.com/image.png` (only works if the website allows it)
    - `data:image/png;base64,<your base 64 data>`
  + In 99.99% of cases you can rightclick an image in google and click `copy image address` and paste it into the Image field.

* I have a "ConnectionError" please fix.
  + Is the server running? Since version `3.11.0` it tells you that in the console
  + Since version `3.15.2` it tells you that in the GUI

* Where is the position override?
  + The functionality of it has not been implemented in the GUI, yet.
* The override position works like this:
  + press the override button.
  + Move the mouse to the top left corner where you want to override the position to.
  + Click.
  + Move the mouse to the bottom right corner where you want to override the position to.
  + Click.
  + The bot will now only draw in the new defined area.
  + Reset by pressing the reset button.
