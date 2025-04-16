const { ipcMain } = require("electron");

function setupWindowActions(mainWindow) {
  let maximizeToggle = false; // Toggle back to original window size if maximize is clicked again

  ipcMain.on("manualMinimize", () => {
    mainWindow.minimize();
  });

  ipcMain.on("manualMaximize", () => {
    if (maximizeToggle) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    maximizeToggle = !maximizeToggle; // Flip the value of maximizeToggle
  });

  ipcMain.on("manualClose", () => {
    mainWindow.close();
  });
}

module.exports = setupWindowActions;
