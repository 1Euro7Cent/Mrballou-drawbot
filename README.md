<div style="text-align: center; ">

<img alt="GitHub all releases" src="https://img.shields.io/github/downloads/1euro7cent/Mrballou-drawbot/total">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/1Euro7Cent/Mrballou-drawbot">
<img alt="GitHub forks" src="https://img.shields.io/github/forks/1Euro7Cent/Mrballou-drawbot">
<img alt="GitHub watchers" src="https://img.shields.io/github/watchers/1Euro7Cent/Mrballou-drawbot">
<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/1Euro7Cent/Mrballou-drawbot">
<img alt="Lines of code" src="https://tokei.rs/b1/github/1Euro7Cent/Mrballou-drawbot?category=code">

</div>

## This is a beta!

If you have questions suggestions or bugs, please open an issue or send me a dm per dc(mrballou#9055)

## installation video (click image):

[![placeholder](https://img.youtube.com/vi/3Js--QGcVpI/0.jpg)](https://youtu.be/3Js--QGcVpI)

## Important!

* I forgot to mention in the video that you can abort the print by pressing the `esc` key or `q`(defineable in the config.json).

* Read the TOS from the website you want to draw on. If the website disallows such things don't draw with the bot on it.

## Additional info:

* When you install an update I recommend deleting `guiConfig.json`. That makes sure that the GUI is being displayed correctly.

* You can redesign the GUI by editing the `guiConfig.json` file. The order of the array displays the order of the GUI elements.

## Installation

* Go to releases.
* Download the latest release.
* Extract the zip file into a folder.
* Run the `drawbot.exe`.
* Close the window again.
* Run `initializePositions.exe` and follow the instructions (abort/save with right click).
* Run `drawbot.exe` again.
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

## FAQ:

* Does the bot work on katura?
  + Yes, but also no. It works, but the website is really slow, and you need to crank up the delay.
  
    I recommend settings like:
    - delay: `15`
    - sort colors by: `size 9-0`
    - onTimeDelayMultiplyer: `0.6` (this makes it really slow but work)
    - fast: `yes`
    - line save: `yes`
    
    feel free to suggest other settings

* I have a "ConnectionError" please fix.
  + Is the server running? Since version `3.11.0` it tells you that in the console

* If the GUI instantly crashes, try running the drawbot.exe and then the GUI. The drawbot.exe creates all necessary files for the GUI to work.
* The override position works like this:
  + press the override button.
  + Move the mouse to the top left corner where you want to override the position to.
  + Click.
  + Move the mouse to the bottom right corner where you want to override the position to.
  + Click.
  + The bot will now only draw in the new defined area.
  + Reset by pressing the reset button.
