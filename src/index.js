const { app, BrowserWindow, screen } = require("electron");
const path = require("node:path");
const setupWindowActions = require("./logic/windowActions"); // Import the module
const changePage = require("./logic/navActions");

const buttonFunctionsSQL = require("./logic/sqlActions");
const buttonFunctionsServer = require("./logic/serverActions");
const buttonFunctionsPostgres = require("./logic/postgreActions");
const buttonFunctionsMongo = require("./logic/mongoActions");

if (require("electron-squirrel-startup")) {
  app.quit();
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    width,
    height,
    minHeight: 500,
    minWidth: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "pages/index.html"));

  changePage(mainWindow, path);
  setupWindowActions(mainWindow); // Use the extracted functionality
  buttonFunctionsSQL();
  buttonFunctionsServer();
  buttonFunctionsPostgres();
  buttonFunctionsMongo();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
