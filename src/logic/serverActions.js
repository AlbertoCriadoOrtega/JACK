const { ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const { exec } = require("child_process");
const kill = require("tree-kill");

let jarProcess = null;
let startedShown = false;
let errorShown = false;

function buttonFunctionsServer() {
  ipcMain.on("startServer", () => {
    if (jarProcess) {
      kill(jarProcess.pid, "SIGKILL", (err) => {
        if (err) console.error("Failed to kill process tree:", err);
      });
      jarProcess = null;
      startedShown = false;
      errorShown = false;
      return;
    }

    // Path to the JAR file
    const jarPath = path.join(__dirname, "..", "server", "Falcon.jar");

    // Working directory: folder containing the JAR
    const workingDir = path.join(__dirname, "..", "server");

    jarProcess = spawn("java", ["-jar", jarPath], { cwd: workingDir });

    jarProcess.stdout.on("data", (data) => {
      if (!startedShown) {
        startedShown = true;
      }
    });

    jarProcess.stderr.on("data", (data) => {
      if (!errorShown) {
        errorShown = true;
        dialog.showMessageBox({
          type: "error",
          title: "Error",
          message: "Error al iniciar el servidor:\n" + data.toString(),
          buttons: ["OK"],
        });
      }
    });
  });

  ipcMain.on("openFolderBtn", () => {
    exec("explorer.exe " + path.join(__dirname, "..", "server/pages"));
  });
}

module.exports = buttonFunctionsServer;
