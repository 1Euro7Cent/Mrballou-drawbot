## This is a beta!

If you have questions suggestions or bugs, please open an issue or send me a dm per dc(mrballou#9055)

## installation video (click image):

[![placeholder](https://img.youtube.com/vi/3Js--QGcVpI/0.jpg)](https://youtu.be/3Js--QGcVpI)

## Important!

- I forgot to mention in the video that you can abort the print by pressing the `esc` key or `q`(defineable in the config.json).

- Read the tos from the website you want to draw on. If the website disallows such things don't draw with the bot on it.

## Additional info:

- When you install an update i recomend deleting `guiConfig.json`. That makes shure that the gui is being displayed correctly.

- You can redising the gui by editing the `guiConfig.json` file. The order of the array displays the order of the gui elemments.

## Installation

- Go to releases.
- Download the latest release.
- Extract the zip file into a folder.
- Run the `drawbot.exe`.
- Close the window again.
- Run `initializePositions.exe` and follow the instructions (abort/save with right click).
- Run `drawbot.exe` again.
- Run `gui.exe`.
- Enjoy!

## Build

- Clone repo.
- Have [c++ build tools](https://visualstudio.microsoft.com/en/) installed.
- Have [python 3.10+](https://www.python.org/downloads/) installed.
- Have [nodejs 16+](https://nodejs.org/en/) installed.
- Install pip requirements (`pip install -r requirements.txt`).
- Install npm dependencies (`npm install`).
- To build run `npm run build`.
- To run the main bot run `node index.js`.
- To run the gui run `python gui.py`.

## Faq:

- If the gui instantly crashes, try running the drawbot.exe and then the gui. The drawbot.exe creates all nessesery files for the gui to work.
- The override position works like this:
  - press the override button.
  - Move the mouse to the top left corner where you want to override the position to.
  - Click.
  - Move the mouse to the bottom right corner where you want to override the position to.
  - Click.
  - The bot will now only draw in the new definded area.
  - Reset by pressing the reset button.
