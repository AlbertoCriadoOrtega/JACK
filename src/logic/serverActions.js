const { ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const { exec } = require("child_process");

let jarProcess = null;
let startedShown = false;
let errorShown = false;

function buttonFunctionsServer() {
  ipcMain.on("startServer", () => {
    if (jarProcess) {
      exec("taskkill /F /IM java.exe", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error al cerrar Java: ${error.message}`);
          return;
        }
        console.log("Todos los procesos java.exe han sido cerrados.");
      });

      jarProcess = null;
      startedShown = false;
      errorShown = false;
      dialog.showMessageBox({
        type: "info",
        title: "Servidor",
        message: "El servidor se ha apagado correctamente",
      });
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
        dialog.showMessageBox({
          type: "info",
          title: "Servidor",
          message: "El servidor ha iniciado correctamente",
          buttons: ["OK"],
        });
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
}

module.exports = buttonFunctionsServer;
