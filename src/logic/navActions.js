const { ipcMain } = require("electron");

function changePage(mainWindow, path) {
  ipcMain.on("changePageMongo", () => {
    mainWindow.loadFile(path.join("src/pages/Mongodb.html"));
  });

  ipcMain.on("changePageSql", () => {
    mainWindow.loadFile(path.join("src/pages/Sql.html"));
  });

  ipcMain.on("changePagePostgre", () => {
    mainWindow.loadFile(path.join("src/pages/Postgre.html"));
  });

  ipcMain.on("changePageHome", () => {
    mainWindow.loadFile(path.join("src/pages/index.html"));
  });

  ipcMain.on("changePageServer", () => {
    mainWindow.loadFile(path.join("src/pages/Http.html"));
  });
}

module.exports = changePage;
